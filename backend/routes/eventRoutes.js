const express = require('express')
const router = express.Router()
const Event = require('../models/Event')

// @route   POST /api/events
// @desc    Create an event
router.post('/', async (req, res) => {
  try {
    const event = await Event.create(req.body)
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
// @desc    Update an event
router.put('/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
    if (!event) {
      return res.status(404).json({ error: 'Event not found' })
    }
    res.status(200).json(event)
  } catch (error) {
    res.status(400).json({ error: error.message || 'Failed to update event' })
  }
})

// @route   DELETE /api/events/:id
// @desc    Delete an event
router.delete('/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id)
    if (!event) {
      return res.status(404).json({ error: 'Event not found' })
    }
    res.status(200).json({ message: 'Event deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to delete event' })
  }
})

module.exports = router
