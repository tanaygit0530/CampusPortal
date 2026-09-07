const express = require('express')
const router = express.Router()
const Registration = require('../models/Registration')
const Event = require('../models/Event')

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

    await Registration.findByIdAndDelete(req.params.id)

    res.status(200).json({ message: 'Registration cancelled successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to cancel registration' })
  }
})

module.exports = router
