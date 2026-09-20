require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const path = require('path')

const userRoutes = require('./routes/userRoutes')
const eventRoutes = require('./routes/eventRoutes')
const registrationRoutes = require('./routes/registrationRoutes')

const app = express()

// Middleware
app.use(cors())
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
app.use('/api/users', userRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/registrations', registrationRoutes)

const PORT = process.env.PORT || 5001

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

module.exports = { app, connectDB }
