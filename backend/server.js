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

const jwt = require('jsonwebtoken')
const JWT_SECRET = process.env.JWT_SECRET || 'campuspass_super_secret_jwt_key_2026_exp5_secure!'

// Socket.IO Authentication Middleware via JWT Handshake
io.use((socket, next) => {
  const token =
    socket.handshake.auth?.token ||
    (socket.handshake.headers?.authorization &&
      socket.handshake.headers.authorization.replace(/^Bearer\s+/i, ''))

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      socket.user = {
        userId: decoded.userId,
        role: decoded.role || 'student',
        isGuest: false,
      }
      return next()
    } catch (err) {
      console.warn(`[Socket.IO Auth] Connection rejected for socket ${socket.id}: ${err.message}`)
      return next(new Error('Authentication error: invalid or expired token'))
    }
  }

  // Allow visitors without a token as guest connections (public events only)
  socket.user = {
    userId: null,
    role: 'visitor',
    isGuest: true,
  }
  return next()
})

// Socket.IO Connection & Room Management (No client chat broadcasting allowed)
io.on('connection', (socket) => {
  const user = socket.user || { role: 'visitor', isGuest: true }
  console.log(
    `[Socket.IO] Client connected: ${socket.id} | User: ${user.userId || 'Visitor'} | Role: ${user.role}`
  )

  // Put admin sockets in 'admins' room
  if (user.role === 'admin') {
    socket.join('admins')
    console.log(`[Socket.IO] Socket ${socket.id} joined 'admins' room`)
  }

  // Put all authenticated users in 'authenticated' room
  if (!user.isGuest) {
    socket.join('authenticated')
  }

  // Handle client disconnect
  socket.on('disconnect', (reason) => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id} (${reason})`)
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
