const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const User = require('../models/User')
const { protect, isAdmin } = require('../middleware/authMiddleware')

// All user management routes are strictly admin-only and never leak passwords
router.use(protect, isAdmin)

// @route   GET /api/users
// @desc    Get all users (admin only, excluding passwords)
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password')
    res.status(200).json(users)
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch users' })
  }
})

// @route   GET /api/users/:id
// @desc    Get one user by ID (admin only, excluding password)
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password')
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    res.status(200).json(user)
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to fetch user' })
  }
})

// @route   PUT /api/users/:id
// @desc    Update a user (admin only)
router.put('/:id', async (req, res) => {
  try {
    const updates = { ...req.body }
    if (updates.password) {
      const salt = await bcrypt.genSalt(10)
      updates.password = await bcrypt.hash(updates.password, salt)
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select('-password')

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    res.status(200).json(user)
  } catch (error) {
    res.status(400).json({ message: error.message || 'Failed to update user' })
  }
})

// @route   DELETE /api/users/:id
// @desc    Delete a user (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    res.status(200).json({ message: 'User deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to delete user' })
  }
})

module.exports = router
