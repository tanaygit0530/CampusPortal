require('dotenv').config()
const http = require('http')
const { Server } = require('socket.io')
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const path = require('path')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

// 1. Validate Required Environment Variables at startup
const requiredEnv = ['JWT_SECRET']
const missingEnv = requiredEnv.filter((key) => !process.env[key])
if (missingEnv.length > 0) {
  console.warn(
    `[Startup Warning] Missing environment variables: ${missingEnv.join(', ')}. Using default fallback.`
  )
}

const JWT_SECRET = process.env.JWT_SECRET || 'campuspass_super_secret_jwt_key_2026_exp5_secure!'

const User = require('./models/User')
const Event = require('./models/Event')
const authRoutes = require('./routes/authRoutes')
const userRoutes = require('./routes/userRoutes')
const eventRoutes = require('./routes/eventRoutes')
const registrationRoutes = require('./routes/registrationRoutes')
const { router: statsRoutes, computeStats } = require('./routes/statsRoutes')

const app = express()
// Trust first proxy (Render / Cloudflare / Vercel) for express-rate-limit and secure headers
app.set('trust proxy', 1)
const server = http.createServer(app)

// 2. CORS and Allowed Origins Configuration
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

const isAllowedOrigin = (origin) => {
  if (!origin) return true
  const sanitized = origin.replace(/\/$/, '')
  if (allowedOrigins.includes(sanitized)) return true
  if (/^https:\/\/.*\.vercel\.app$/.test(sanitized)) return true
  return false
}

// 3. Socket.IO Server Initialization
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, true)
      }
      return callback(null, true)
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
})

// Store io instance on express app for route handlers
app.set('io', io)

// 4. Socket.IO Authentication Middleware via JWT Handshake
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
      console.warn(`[Socket.IO Auth] Invalid or expired token: ${err.message}`)
      return next(new Error('Authentication error: invalid or expired token'))
    }
  }

  // Allow unauthenticated visitors to receive public broadcasts
  socket.user = {
    userId: null,
    role: 'visitor',
    isGuest: true,
  }
  return next()
})

// 5. Socket.IO Connection & Room Management
io.on('connection', (socket) => {
  const user = socket.user || { role: 'visitor', isGuest: true }
  
  // Everyone joins the public room for global events and stats
  socket.join('public')

  // Role & Personal rooms
  if (user.role === 'admin') {
    socket.join('admins')
  }

  if (!user.isGuest && user.userId) {
    socket.join('authenticated')
    // Personal room for cross-tab student sync
    socket.join(`user:${user.userId}`)
  }

  socket.on('disconnect', (reason) => {
    // disconnected
  })
})

// 6. Security & Express Middlewares
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

// Rate Limiting: stricter on login/signup, general on other routes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
  message: { message: 'Too many requests, please try again later' },
})
app.use('/api/', generalLimiter)

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  message: { message: 'Too many authentication attempts, please try again later' },
})
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/register', authLimiter)

app.use(express.json())

// 7. Database Connection & Admin Bootstrap
const mongoURI = (process.env.MONGO_URI || '').trim() || 'mongodb://127.0.0.1:27017/CampusPassDB'

const bootstrapAdmin = async () => {
  try {
    const adminCount = await User.countDocuments({ role: 'admin' })
    if (adminCount === 0) {
      const adminName = process.env.ADMIN_NAME || 'Campus Administrator'
      const adminEmail = (process.env.ADMIN_EMAIL || 'admin@campuspass.edu').toLowerCase()
      const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPassword123!'

      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(adminPassword, salt)

      await User.create({
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
      })
      console.log(`[Bootstrap] Initial admin created: ${adminEmail}`)
    } else {
      console.log(`[Bootstrap] Administrator account verified (${adminCount} existing)`)
    }
  } catch (error) {
    console.error('[Bootstrap Error] Failed to verify/create bootstrap admin:', error.message)
  }
}

// 8. Server-Side Scheduled Job: Close passed deadlines
const startDeadlineWatcher = () => {
  setInterval(async () => {
    try {
      const now = new Date()
      // Find open events with a deadline and check if actual date has passed
      const candidateEvents = await Event.find({
        status: 'open',
        registrationDeadline: { $exists: true, $ne: '' },
      })

      const expiredEvents = []
      for (const event of candidateEvents) {
        const d = new Date(event.registrationDeadline)
        if (!isNaN(d.getTime()) && d < now) {
          event.status = 'closed'
          await event.save()
          expiredEvents.push(event)
        }
      }

      for (const event of expiredEvents) {

        // Broadcast to all clients
        io.emit('event:updated', {
          event,
          message: `Registration for "${event.title}" has now closed (deadline passed).`,
          timestamp: new Date().toISOString(),
        })

        io.emit('event:seatsUpdated', {
          eventId: event._id.toString(),
          seatsLeft: event.seatsLeft,
          seatsTotal: event.totalSeats,
          status: 'closed',
          isFull: event.seatsLeft <= 0,
        })
      }

      if (expiredEvents.length > 0) {
        const stats = await computeStats()
        io.emit('stats:updated', stats)
      }
    } catch (err) {
      // background ticker failure ignored
    }
  }, 30000) // check every 30 seconds
}

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

    // Bootstrap first admin account safely
    await bootstrapAdmin()

    // Start background deadline checker
    startDeadlineWatcher()
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
app.use('/api/stats', statsRoutes)

// 404 Route Not Found Handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` })
})

// Centralized Error-Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack || err)
  const statusCode = err.status || err.statusCode || 500
  res.status(statusCode).json({ message: err.message || 'Something went wrong on the server' })
})

const PORT = process.env.PORT || 5000

if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`)
  })
}

module.exports = { app, server, io, connectDB }
