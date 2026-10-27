const mongoose = require('mongoose')

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
    },
    tagline: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      default: 'Technical',
    },
    subcategory: {
      type: String,
      trim: true,
      default: '',
    },
    bannerUrl: {
      type: String,
      trim: true,
      default: '',
    },
    date: {
      type: String,
      required: [true, 'Event date is required'],
    },
    time: {
      type: String,
      default: '10:00 AM',
    },
    venue: {
      type: String,
      required: [true, 'Venue is required'],
      trim: true,
    },
    mode: {
      type: String,
      enum: ['on-campus', 'online', 'hybrid', 'On-campus', 'Online', 'Hybrid'],
      default: 'on-campus',
    },
    registrationDeadline: {
      type: String,
      trim: true,
      default: '',
    },
    totalSeats: {
      type: Number,
      required: [true, 'Total seats is required'],
      min: [1, 'Total seats must be at least 1'],
    },
    seatsLeft: {
      type: Number,
      required: [true, 'Seats left is required'],
      min: [0, 'Seats left cannot be negative'],
    },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
    },
    isTeamEvent: {
      type: Boolean,
      default: false,
    },
    minTeamSize: {
      type: Number,
      default: 1,
      min: 1,
    },
    maxTeamSize: {
      type: Number,
      default: 1,
      min: 1,
    },
    eligibility: {
      type: String,
      trim: true,
      default: 'Open to all students',
    },
    prizes: {
      type: String,
      trim: true,
      default: '',
    },
    rules: [
      {
        type: String,
        trim: true,
      },
    ],
    contactName: {
      type: String,
      trim: true,
      default: '',
    },
    contactEmail: {
      type: String,
      trim: true,
      default: '',
    },
    color: {
      type: String,
      default: 'amber',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model('Event', eventSchema)
