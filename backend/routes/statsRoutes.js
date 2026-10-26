const express = require('express')
const router = express.Router()
const Event = require('../models/Event')
const Registration = require('../models/Registration')

// Helper function to calculate real-time stats from DB
const computeStats = async () => {
  const [events, confirmedRegistrationsCount] = await Promise.all([
    Event.find({}),
    Registration.countDocuments({ status: 'confirmed' }),
  ])

  const totalEvents = events.length
  const openEvents = events.filter((e) => e.status === 'open').length
  const totalSeats = events.reduce((sum, e) => sum + (e.totalSeats || 0), 0)
  const seatsLeftSum = events.reduce((sum, e) => sum + (e.seatsLeft ?? e.totalSeats ?? 0), 0)
  const seatsFilled = Math.max(0, totalSeats - seatsLeftSum)
  const seatsFilledPercentage = totalSeats > 0 ? Math.round((seatsFilled / totalSeats) * 100) : 0

  return {
    totalEvents,
    openEvents,
    totalRegistrations: confirmedRegistrationsCount,
    totalSeats,
    seatsFilled,
    seatsFilledPercentage,
  }
}

// GET /api/stats (Public)
router.get('/', async (req, res) => {
  try {
    const stats = await computeStats()
    res.json(stats)
  } catch (error) {
    console.error('Error fetching stats:', error)
    res.status(500).json({ message: 'Failed to compute statistics' })
  }
})

module.exports = { router, computeStats }
