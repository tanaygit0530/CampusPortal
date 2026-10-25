require('dotenv').config()
const http = require('http')
const { Server } = require('socket.io')
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
const server = http.createServer(app)

const envOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((u) => u.trim().replace(/\/$/, ''))
  : []

const defaultOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]

const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins])).filter(Boolean)

// Dynamic origin checker matching exact origins or Vercel deployment domains
const isAllowedOrigin = (origin) => {
  if (!origin) return true
  const sanitized = origin.replace(/\/$/, '')
  if (allowedOrigins.includes(sanitized)) return true
  if (/^https:\/\/.*\.vercel\.app$/.test(sanitized)) return true
  return false
}

// Socket.IO Server initialization with CORS
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, true)
      }
      return callback(null, true)
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

// Store io instance on app for bonus real-time event notifications
app.set('io', io)

// Socket.IO Event Handlers
io.on('connection', (socket) => {
  console.log(`A user connected: ${socket.id}`)

  // Listen for chatMessage from client
  socket.on('chatMessage', (data) => {
    // Broadcast to all connected clients (including sender)
    io.emit('chatMessage', {
      username: data?.username || 'Anonymous',
      message: data?.message || '',
      timestamp: data?.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    })
  })

  // Handle client disconnect
  socket.on('disconnect', () => {
    console.log(`A user disconnected: ${socket.id}`)
  })
})

// Security Middleware
app.use(helmet())

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, true)
      }
      return callback(null, true)
    },
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

// Docker health-check endpoint
app.get('/api', (req, res) => {
  res.status(200).json({ message: 'Backend is running inside Docker!' })
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

const PORT = process.env.PORT || 5000

if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`)
  })
}

module.exports = { app, server, io, connectDB }
