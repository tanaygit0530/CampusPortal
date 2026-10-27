const express = require('express')
const router = express.Router()
const Event = require('../models/Event')
const Registration = require('../models/Registration')
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

// @route   GET /api/events
// @desc    Get all events (public)
router.get('/', async (req, res) => {
  try {
    const events = await Event.find()
      .populate('createdBy', 'name email role')
      .sort({ date: 1, createdAt: -1 })
    res.status(200).json(events)
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch events' })
  }
})

// @route   GET /api/events/:id
// @desc    Get one event by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('createdBy', 'name email role')
    if (!event) {
      return res.status(404).json({ message: 'Event not found' })
    }
    res.status(200).json(event)
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch event' })
  }
})

// @route   POST /api/events
// @desc    Create an event (Admin only)
router.post('/', protect, isAdmin, async (req, res) => {
  try {
    const {
      title,
      tagline,
      description,
      category,
      subcategory,
      bannerUrl,
      date,
      time,
      venue,
      mode,
      registrationDeadline,
      totalSeats,
      isTeamEvent,
      minTeamSize,
      maxTeamSize,
      eligibility,
      prizes,
      rules,
      contactName,
      contactEmail,
      color,
    } = req.body

    // Validation
    if (!title || !description || !category || !date || !venue || !totalSeats) {
      return res.status(400).json({ message: 'Please fill in all required fields' })
    }

    const seatCount = parseInt(totalSeats, 10)
    if (isNaN(seatCount) || seatCount <= 0) {
      return res.status(400).json({ message: 'Total seats must be a positive integer' })
    }

    if (registrationDeadline && date) {
      const deadlineDate = new Date(registrationDeadline)
      const eventDate = new Date(date)
      if (deadlineDate > eventDate) {
        return res.status(400).json({ message: 'Registration deadline must be before the event date' })
      }
    }

    const event = await Event.create({
      title,
      tagline: tagline || '',
      description,
      category,
      subcategory: subcategory ? subcategory.trim() : '',
      bannerUrl: bannerUrl || '',
      date,
      time: time || '10:00 AM',
      venue,
      mode: mode || 'on-campus',
      registrationDeadline: registrationDeadline || date,
      totalSeats: seatCount,
      seatsLeft: seatCount,
      status: 'open',
      isTeamEvent: Boolean(isTeamEvent),
      minTeamSize: isTeamEvent ? parseInt(minTeamSize, 10) || 2 : 1,
      maxTeamSize: isTeamEvent ? parseInt(maxTeamSize, 10) || 4 : 1,
      eligibility: eligibility || 'Open to all students',
      prizes: prizes || '',
      rules: Array.isArray(rules) ? rules : typeof rules === 'string' && rules ? rules.split('\n').filter(Boolean) : [],
      contactName: contactName || req.user.name || 'Admin',
      contactEmail: contactEmail || req.user.email || 'admin@campuspass.edu',
      color: color || '#1B2430',
      createdBy: req.user.userId,
    })

    const populatedEvent = await Event.findById(event._id).populate('createdBy', 'name email role')

    // Real-time broadcast
    const io = req.app.get('io')
    if (io) {
      io.emit('event:created', {
        event: populatedEvent,
        message: `New event added: ${populatedEvent.title}`,
        timestamp: new Date().toISOString(),
      })
      await broadcastStats(io)
    }

    res.status(201).json(populatedEvent)
  } catch (error) {
    res.status(400).json({ message: error.message || 'Failed to create event' })
  }
})

// @route   PUT /api/events/:id
// @desc    Update an event (Admin only)
router.put('/:id', protect, isAdmin, async (req, res) => {
  try {
    const existing = await Event.findById(req.params.id)
    if (!existing) {
      return res.status(404).json({ message: 'Event not found' })
    }

    const updates = { ...req.body }

    // Date vs Deadline validation
    const eventDate = updates.date ? new Date(updates.date) : new Date(existing.date)
    const deadlineDate = updates.registrationDeadline ? new Date(updates.registrationDeadline) : (existing.registrationDeadline ? new Date(existing.registrationDeadline) : null)
    if (deadlineDate && eventDate && deadlineDate > eventDate) {
      return res.status(400).json({ message: 'Registration deadline must be before the event date' })
    }

    // Seat count validation
    if (updates.totalSeats !== undefined) {
      const newTotal = parseInt(updates.totalSeats, 10)
      if (isNaN(newTotal) || newTotal <= 0) {
        return res.status(400).json({ message: 'Total seats must be a positive integer' })
      }

      const confirmedCount = await Registration.countDocuments({
        event: req.params.id,
        status: 'confirmed',
      })

      if (newTotal < confirmedCount) {
        return res.status(400).json({
          message: `Total seats cannot be reduced below current confirmed registrations (${confirmedCount})`,
        })
      }

      updates.totalSeats = newTotal
      updates.seatsLeft = newTotal - confirmedCount
      if (updates.seatsLeft === 0 && updates.status !== 'closed') {
        updates.status = 'closed'
      }
    }

    if (updates.rules && typeof updates.rules === 'string') {
      updates.rules = updates.rules.split('\n').filter(Boolean)
    }

    const updatedEvent = await Event.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate('createdBy', 'name email role')

    // Real-time broadcast
    const io = req.app.get('io')
    if (io) {
      io.emit('event:updated', {
        event: updatedEvent,
        message: `Event updated: ${updatedEvent.title}`,
        timestamp: new Date().toISOString(),
      })
      // Also broadcast seat update in case seats changed
      io.emit('event:seatsUpdated', {
        eventId: updatedEvent._id.toString(),
        seatsLeft: updatedEvent.seatsLeft,
        seatsTotal: updatedEvent.totalSeats,
        status: updatedEvent.status,
        isFull: updatedEvent.seatsLeft <= 0,
      })
      await broadcastStats(io)
    }

    res.status(200).json(updatedEvent)
  } catch (error) {
    res.status(400).json({ message: error.message || 'Failed to update event' })
  }
})

// @route   DELETE /api/events/:id
// @desc    Delete an event (Admin only) - also deletes associated registrations
router.delete('/:id', protect, isAdmin, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) {
      return res.status(404).json({ message: 'Event not found' })
    }

    // Cascade delete all registrations for this event
    const deletedRegs = await Registration.deleteMany({ event: req.params.id })

    await Event.findByIdAndDelete(req.params.id)

    // Real-time broadcast
    const io = req.app.get('io')
    if (io) {
      io.emit('event:deleted', {
        eventId: req.params.id,
        title: event.title,
        message: `Event "${event.title}" has been deleted.`,
        deletedRegistrationsCount: deletedRegs.deletedCount,
        timestamp: new Date().toISOString(),
      })
      await broadcastStats(io)
    }

    res.status(200).json({
      message: 'Event and associated registrations deleted successfully',
      deletedRegistrations: deletedRegs.deletedCount,
    })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to delete event' })
  }
})

module.exports = router
