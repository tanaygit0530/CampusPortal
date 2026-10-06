require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const path = require('path')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')

const authRoutes = require('./routes/authRoutes')
const userRoutes = require('./routes/userRoutes')
const eventRoutes = require('./routes/eventRoutes')
const registrationRoutes = require('./routes/registrationRoutes')

const app = express()

// Security Middleware
app.use(helmet())
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
)

// Rate Limiting (100 requests per 15 minutes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests, please try again later' },
})
app.use('/api/', limiter)

app.use(express.json())

// Database Connection
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/CampusPassDB'

const connectDB = async () => {
  try {
    if (mongoURI.includes('username:password')) {
      const { MongoMemoryServer } = require('mongodb-memory-server')
      const mongoServer = await MongoMemoryServer.create({
        downloadDir: path.join(__dirname, 'node_modules', '.cache', 'mongodb-memory-server'),
      })
      const memoryUri = mongoServer.getUri()
      await mongoose.connect(memoryUri)
      console.log('MongoDB Connected (In-Memory Server)')
    } else {
      await mongoose.connect(mongoURI)
      console.log('MongoDB Connected')
    }
  } catch (err) {
    console.error('MongoDB Connection Error:', err.message)
  }
}

connectDB()

// Base route
app.get('/', (req, res) => {
  res.send('CampusPass API is Running')
})

// Mount API routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/registrations', registrationRoutes)

// Centralized Error-Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: 'Something went wrong on the server' })
})

const PORT = process.env.PORT || 5001

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

module.exports = { app, connectDB }
