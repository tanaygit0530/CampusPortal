const express = require('express')
const router = express.Router()
const Registration = require('../models/Registration')
const Event = require('../models/Event')
const User = require('../models/User')
const { protect, isAdmin } = require('../middleware/authMiddleware')
const { computeStats } = require('./statsRoutes')

// Broadcast real-time stats helper
const broadcastStats = async (io) => {
  if (!io) return
  try {
    const stats = await computeStats()
    io.emit('stats:updated', stats)
  } catch (err) {
    console.error('Failed to broadcast stats:', err.message)
  }
}

// @route   POST /api/registrations
// @desc    Register for an event (Students only) with atomic conditional seat decrement
// @access  Private (student only)
router.post('/', protect, async (req, res) => {
  const io = req.app.get('io')

  try {
    // 1. Only students can register
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can register for campus events' })
    }

    const {
      event: eventId,
      phone,
      department,
      year,
      teamName,
      teammates,
      notes,
      rulesAccepted,
    } = req.body

    if (!eventId) {
      return res.status(400).json({ message: 'Event ID is required' })
    }

    if (!phone || !department || !year) {
      return res.status(400).json({ message: 'Phone, department, and academic year are required' })
    }

    if (rulesAccepted !== true) {
      return res.status(400).json({ message: 'You must accept the event rules to proceed' })
    }

    // 2. Fetch event to verify existence, status, deadline, team configuration
    const targetEvent = await Event.findById(eventId)
    if (!targetEvent) {
      return res.status(404).json({ message: 'Event not found' })
    }

    if (targetEvent.status !== 'open') {
      return res.status(400).json({ message: 'Registration for this event is closed' })
    }

    if (targetEvent.registrationDeadline && new Date() > new Date(targetEvent.registrationDeadline)) {
      return res.status(400).json({ message: 'Registration deadline has passed' })
    }

    // 3. Team size verification
    if (targetEvent.isTeamEvent) {
      const validTeammates = Array.isArray(teammates) ? teammates.filter((t) => t && (t.name || t.email)) : []
      const totalTeamCount = validTeammates.length + 1 // including applicant
      if (totalTeamCount < targetEvent.minTeamSize || totalTeamCount > targetEvent.maxTeamSize) {
        return res.status(400).json({
          message: `Team size must be between ${targetEvent.minTeamSize} and ${targetEvent.maxTeamSize} members (including yourself)`,
        })
      }
    }

    // 4. Check if student already has a confirmed registration
    const existingReg = await Registration.findOne({
      event: eventId,
      student: req.user.userId,
      status: 'confirmed',
    })

    if (existingReg) {
      return res.status(409).json({ message: 'You are already registered for this event' })
    }

    // 5. ATOMIC conditional seat decrement (prevents overbooking race conditions)
    const updatedEvent = await Event.findOneAndUpdate(
      {
        _id: eventId,
        status: 'open',
        seatsLeft: { $gt: 0 },
      },
      {
        $inc: { seatsLeft: -1 },
      },
      { new: true }
    )

    if (!updatedEvent) {
      return res.status(400).json({ message: 'Sorry, this event is now full' })
    }

    // If seats hit 0, mark as closed
    if (updatedEvent.seatsLeft === 0) {
      await Event.findByIdAndUpdate(eventId, { status: 'closed' })
      updatedEvent.status = 'closed'
    }

    // 6. Create registration record
    let registration
    try {
      registration = await Registration.create({
        event: eventId,
        student: req.user.userId,
        phone,
        department,
        year,
        teamName: teamName || '',
        teammates: Array.isArray(teammates) ? teammates : [],
        notes: notes || '',
        rulesAccepted: true,
        status: 'confirmed',
      })
    } catch (createError) {
      // Rollback atomic seat decrement if duplicate key or DB validation failed
      await Event.findByIdAndUpdate(eventId, {
        $inc: { seatsLeft: 1 },
        status: 'open',
      })
      if (createError.code === 11000) {
        return res.status(409).json({ message: 'You are already registered for this event' })
      }
      throw createError
    }

    const populatedReg = await Registration.findById(registration._id)
      .populate('event')
      .populate('student', 'name email role')

    const studentUser = populatedReg.student
    const studentName = studentUser?.name || 'A student'

    // 7. Emit real-time updates
    if (io) {
      // A. Public seat update
      io.emit('event:seatsUpdated', {
        eventId: targetEvent._id.toString(),
        seatsLeft: updatedEvent.seatsLeft,
        seatsTotal: updatedEvent.totalSeats,
        status: updatedEvent.status,
        isFull: updatedEvent.seatsLeft <= 0,
      })

      // B. Admin room notification & live registrants table insertion
      io.to('admins').emit('admin:notification', {
        type: 'registration',
        studentName,
        eventTitle: targetEvent.title,
        eventId: targetEvent._id.toString(),
        message: `${studentName} registered for ${targetEvent.title}`,
        timestamp: new Date().toISOString(),
      })

      io.to('admins').emit('registration:created', {
        registration: populatedReg,
        eventId: targetEvent._id.toString(),
      })

      // C. Student's personal room notification across multiple open tabs/devices
      io.to(`user:${req.user.userId}`).emit('myRegistration:added', populatedReg)

      // D. Broadcast updated system stats
      await broadcastStats(io)
    }

    res.status(201).json(populatedReg)
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ message: error.message || 'Failed to complete registration' })
  }
})

// @route   GET /api/registrations/my
// @desc    Get all registrations for currently logged-in student
// @access  Private (student only)
router.get('/my', protect, async (req, res) => {
  try {
    const registrations = await Registration.find({ student: req.user.userId })
      .populate('event')
      .sort({ createdAt: -1 })
    res.status(200).json(registrations)
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch your registrations' })
  }
})

// @route   DELETE /api/registrations/my/:id
// @desc    Cancel student's own registration (restores exactly 1 seat, cannot be done twice)
// @access  Private (student only)
router.delete('/my/:id', protect, async (req, res) => {
  const io = req.app.get('io')

  try {
    // Atomic find and update: only match if student owns it AND it is currently 'confirmed'
    const registration = await Registration.findOneAndUpdate(
      {
        _id: req.params.id,
        student: req.user.userId,
        status: 'confirmed',
      },
      {
        status: 'cancelled',
      },
      { new: true }
    )
      .populate('event')
      .populate('student', 'name email role')

    if (!registration) {
      return res.status(404).json({
        message: 'Active registration not found or already cancelled',
      })
    }

    // Atomically restore 1 seat and reopen event if it was closed
    const updatedEvent = await Event.findByIdAndUpdate(
      registration.event._id,
      {
        $inc: { seatsLeft: 1 },
        status: 'open',
      },
      { new: true }
    )

    const studentName = registration.student?.name || 'A student'

    if (io && updatedEvent) {
      // 1. Live seat count broadcast to all connected clients
      io.emit('event:seatsUpdated', {
        eventId: updatedEvent._id.toString(),
        seatsLeft: updatedEvent.seatsLeft,
        seatsTotal: updatedEvent.totalSeats,
        status: updatedEvent.status,
        isFull: updatedEvent.seatsLeft <= 0,
      })

      // 2. Admin notification
      io.to('admins').emit('admin:notification', {
        type: 'cancellation',
        studentName,
        eventTitle: updatedEvent.title,
        eventId: updatedEvent._id.toString(),
        message: `${studentName} cancelled registration for ${updatedEvent.title}`,
        timestamp: new Date().toISOString(),
      })

      // 3. Live update for admin registrants table
      io.to('admins').emit('registration:cancelled', {
        registrationId: registration._id.toString(),
        eventId: updatedEvent._id.toString(),
        studentId: req.user.userId,
      })

      // 4. Student's personal room update
      io.to(`user:${req.user.userId}`).emit('myRegistration:cancelled', {
        registrationId: registration._id.toString(),
        eventId: updatedEvent._id.toString(),
      })

      // 5. Global stats
      await broadcastStats(io)
    }

    res.status(200).json({
      message: 'Registration cancelled successfully. Seat restored.',
      registration,
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to cancel registration' })
  }
})

// @route   GET /api/registrations/all
// @desc    Get all registrations across all events for global CSV export (Admin only)
// @access  Private (Admin only)
router.get('/all', protect, isAdmin, async (req, res) => {
  try {
    const registrations = await Registration.find()
      .populate('event', 'title category date time venue mode')
      .populate('student', 'name email role')
      .sort({ createdAt: -1 })
    res.status(200).json(registrations)
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch all registrations' })
  }
})

// @route   GET /api/registrations/event/:eventId
// @desc    Get all registrants for an event (Admin only)
// @access  Private (Admin only)
router.get('/event/:eventId', protect, isAdmin, async (req, res) => {
  try {
    const registrations = await Registration.find({ event: req.params.eventId })
      .populate('student', 'name email role')
      .sort({ createdAt: -1 })
    res.status(200).json(registrations)
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch event registrants' })
  }
})

// @route   DELETE /api/registrations/admin/:id
// @desc    Admin removes a registrant (restores seat)
// @access  Private (Admin only)
router.delete('/admin/:id', protect, isAdmin, async (req, res) => {
  const io = req.app.get('io')

  try {
    const registration = await Registration.findById(req.params.id)
      .populate('event')
      .populate('student', 'name email role')

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' })
    }

    const eventId = registration.event._id
    const wasConfirmed = registration.status === 'confirmed'

    // Delete registration record
    await Registration.findByIdAndDelete(req.params.id)

    let updatedEvent = null
    if (wasConfirmed) {
      updatedEvent = await Event.findByIdAndUpdate(
        eventId,
        {
          $inc: { seatsLeft: 1 },
          status: 'open',
        },
        { new: true }
      )
    }

    const studentName = registration.student?.name || 'A student'

    if (io && updatedEvent) {
      io.emit('event:seatsUpdated', {
        eventId: updatedEvent._id.toString(),
        seatsLeft: updatedEvent.seatsLeft,
        seatsTotal: updatedEvent.totalSeats,
        status: updatedEvent.status,
        isFull: updatedEvent.seatsLeft <= 0,
      })

      io.to('admins').emit('registration:cancelled', {
        registrationId: req.params.id,
        eventId: eventId.toString(),
        studentId: registration.student?._id,
      })

      // Notify the removed student in their personal room
      if (registration.student?._id) {
        io.to(`user:${registration.student._id.toString()}`).emit('myRegistration:cancelled', {
          registrationId: req.params.id,
          eventId: eventId.toString(),
          message: `Your registration for "${registration.event.title}" was removed by an administrator.`,
        })
      }

      await broadcastStats(io)
    }

    res.status(200).json({ message: 'Registrant removed and seat restored' })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to remove registrant' })
  }
})

module.exports = router
