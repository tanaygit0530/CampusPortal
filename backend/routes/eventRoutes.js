const express = require('express')
const router = express.Router()
const Event = require('../models/Event')
const { protect, isAdmin } = require('../middleware/authMiddleware')

// @route   POST /api/events
// @desc    Create an event (Admin only)
router.post('/', protect, isAdmin, async (req, res) => {
  try {
    const event = await Event.create({
      ...req.body,
      createdBy: req.user.userId,
    })

    // Emit real-time notification to all connected clients
    const io = req.app.get('io')
    if (io) {
      io.emit('event:created', {
        event,
        message: `New event added: ${event.title}`,
        timestamp: new Date().toISOString(),
      })
    }

    res.status(201).json(event)
  } catch (error) {
    res.status(400).json({ error: error.message || 'Failed to create event' })
  }
})

// @route   GET /api/events
// @desc    Get all events
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().populate('createdBy', 'name email role')
    res.status(200).json(events)
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch events' })
  }
})

// @route   GET /api/events/:id
// @desc    Get one event by ID
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('createdBy', 'name email role')
    if (!event) {
      return res.status(404).json({ error: 'Event not found' })
    }
    res.status(200).json(event)
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to fetch event' })
  }
})

// @route   PUT /api/events/:id
// @desc    Update an event (Admin only)
router.put('/:id', protect, isAdmin, async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
    if (!event) {
      return res.status(404).json({ error: 'Event not found' })
    }

    // Emit real-time update event
    const io = req.app.get('io')
    if (io) {
      io.emit('event:updated', {
        event,
        message: `Event updated: ${event.title}`,
        timestamp: new Date().toISOString(),
      })
    }

    res.status(200).json(event)
  } catch (error) {
    res.status(400).json({ error: error.message || 'Failed to update event' })
  }
})

// @route   DELETE /api/events/:id
// @desc    Delete an event (Admin only)
router.delete('/:id', protect, isAdmin, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) {
      return res.status(404).json({ error: 'Event not found' })
    }

    await Event.findByIdAndDelete(req.params.id)

    // Emit real-time delete event with event details
    const io = req.app.get('io')
    if (io) {
      io.emit('event:deleted', {
        eventId: req.params.id,
        title: event.title,
        message: `Event "${event.title}" has been deleted.`,
        timestamp: new Date().toISOString(),
      })
    }

    res.status(200).json({ message: 'Event deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to delete event' })
  }
})

module.exports = router

