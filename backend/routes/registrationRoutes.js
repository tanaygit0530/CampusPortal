const express = require('express')
const router = express.Router()
const Registration = require('../models/Registration')
const Event = require('../models/Event')
const User = require('../models/User')

// @route   POST /api/registrations
// @desc    Create a registration (check seatsLeft > 0, decrement seatsLeft)
router.post('/', async (req, res) => {
  try {
    const { event, student, status } = req.body

    if (!event || !student) {
      return res.status(400).json({ error: 'Event ID and Student ID are required' })
    }

    const targetEvent = await Event.findById(event)
    if (!targetEvent) {
      return res.status(404).json({ error: 'Event not found' })
    }

    if (targetEvent.seatsLeft <= 0) {
      return res.status(400).json({ error: 'No seats left for this event' })
    }

    // Decrement seatsLeft by 1
    targetEvent.seatsLeft -= 1
    if (targetEvent.seatsLeft === 0) {
      targetEvent.status = 'closed'
    }
    await targetEvent.save()

    const registration = await Registration.create({
      event,
      student,
      status: status || 'confirmed',
    })

    // Fetch student info for real-time notifications
    const studentUser = await User.findById(student).select('name email role')
    const studentName = studentUser?.name || 'A student'

    // Emit real-time Socket.IO events from server
    const io = req.app.get('io')
    if (io) {
      // 1. Live seat count broadcast to all connected clients
      io.emit('event:seatsUpdated', {
        eventId: targetEvent._id.toString(),
        seatsLeft: targetEvent.seatsLeft,
        seatsTotal: targetEvent.totalSeats,
        isFull: targetEvent.seatsLeft <= 0,
      })

      // 2. Low-seat alert (if seats drop <= 10% and still available)
      if (
        targetEvent.totalSeats > 0 &&
        targetEvent.seatsLeft / targetEvent.totalSeats <= 0.1 &&
        targetEvent.seatsLeft > 0
      ) {
        io.emit('event:lowSeats', {
          eventId: targetEvent._id.toString(),
          title: targetEvent.title,
          seatsLeft: targetEvent.seatsLeft,
          message: `Hurry! Only ${targetEvent.seatsLeft} seats left for "${targetEvent.title}"!`,
          timestamp: new Date().toISOString(),
        })
      }

      // 3. Admin-only notification in 'admins' room
      io.to('admins').emit('admin:notification', {
        type: 'registration',
        studentName,
        eventTitle: targetEvent.title,
        eventId: targetEvent._id.toString(),
        message: `${studentName} registered for ${targetEvent.title}`,
        timestamp: new Date().toISOString(),
      })

      // 4. Live update for admin's registrants table
      io.to('admins').emit('registration:created', {
        registration: {
          _id: registration._id,
          id: registration._id,
          eventId: targetEvent._id.toString(),
          studentName: studentUser?.name || 'Student',
          studentEmail: studentUser?.email || '',
          department: 'General',
          year: '1st',
          registeredAt: new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          status: 'Confirmed',
        },
        eventId: targetEvent._id.toString(),
      })
    }

    res.status(201).json(registration)
  } catch (error) {
    res.status(400).json({ error: error.message || 'Failed to create registration' })
  }
})

// @route   GET /api/registrations
// @desc    Get all registrations with populated event and student details
router.get('/', async (req, res) => {
  try {
    const registrations = await Registration.find()
      .populate('event')
      .populate('student', 'name email role')
    res.status(200).json(registrations)
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch registrations' })
  }
})

// @route   GET /api/registrations/student/:studentId
// @desc    Get all registrations for one student
router.get('/student/:studentId', async (req, res) => {
  try {
    const registrations = await Registration.find({ student: req.params.studentId }).populate(
      'event'
    )
    res.status(200).json(registrations)
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch student registrations' })
  }
})

// @route   GET /api/registrations/event/:eventId
// @desc    Get all registrations for one event with student details populated
router.get('/event/:eventId', async (req, res) => {
  try {
    const registrations = await Registration.find({ event: req.params.eventId }).populate(
      'student',
      'name email role'
    )
    res.status(200).json(registrations)
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch event registrations' })
  }
})

// @route   DELETE /api/registrations/:id
// @desc    Cancel/delete a registration and increment seatsLeft on linked Event back by 1
router.delete('/:id', async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id)
    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' })
    }

    // Increment event's seatsLeft back by 1
    const targetEvent = await Event.findById(registration.event)
    if (targetEvent) {
      targetEvent.seatsLeft += 1
      if (targetEvent.seatsLeft > 0) {
        targetEvent.status = 'open'
      }
      await targetEvent.save()
    }

    // Fetch student info for cancellation notification
    const studentUser = await User.findById(registration.student).select('name email role')
    const studentName = studentUser?.name || 'A student'

    await Registration.findByIdAndDelete(req.params.id)

    // Emit real-time Socket.IO events
    const io = req.app.get('io')
    if (io && targetEvent) {
      // 1. Live seat count broadcast to all connected clients
      io.emit('event:seatsUpdated', {
        eventId: targetEvent._id.toString(),
        seatsLeft: targetEvent.seatsLeft,
        seatsTotal: targetEvent.totalSeats,
        isFull: targetEvent.seatsLeft <= 0,
      })

      // 2. Admin-only notification in 'admins' room
      io.to('admins').emit('admin:notification', {
        type: 'cancellation',
        studentName,
        eventTitle: targetEvent.title,
        eventId: targetEvent._id.toString(),
        message: `${studentName} cancelled registration for ${targetEvent.title}`,
        timestamp: new Date().toISOString(),
      })

      // 3. Live removal from admin registrants table
      io.to('admins').emit('registration:cancelled', {
        registrationId: req.params.id,
        eventId: targetEvent._id.toString(),
        studentId: registration.student,
        studentEmail: studentUser?.email,
      })
    }

    res.status(200).json({ message: 'Registration cancelled successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to cancel registration' })
  }
})

module.exports = router
