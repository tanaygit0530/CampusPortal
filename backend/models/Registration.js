const mongoose = require('mongoose')

const registrationSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    year: {
      type: String,
      required: [true, 'Academic year is required'],
      trim: true,
    },
    teamName: {
      type: String,
      trim: true,
      default: '',
    },
    teammates: [
      {
        name: { type: String, trim: true },
        email: { type: String, trim: true },
      },
    ],
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    rulesAccepted: {
      type: Boolean,
      required: [true, 'Rules must be accepted'],
      validate: {
        validator: (v) => v === true,
        message: 'You must accept the event rules',
      },
    },
    status: {
      type: String,
      enum: ['confirmed', 'cancelled'],
      default: 'confirmed',
    },
  },
  {
    timestamps: true,
  }
)

// Ensure student cannot register for the same event twice (only 1 active registration or unique compound index)
registrationSchema.index({ event: 1, student: 1 }, { unique: true })

module.exports = mongoose.model('Registration', registrationSchema)
