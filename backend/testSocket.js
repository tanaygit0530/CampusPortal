const jwt = require('jsonwebtoken')
const { io: Client } = require('../frontend/node_modules/socket.io-client')

const JWT_SECRET = process.env.JWT_SECRET || 'campuspass_super_secret_jwt_key_2026_exp5_secure!'
const targetUrl = 'http://localhost:5000'

async function runRealTimeTests() {
  console.log('--- Starting CampusPass Real-Time Socket.IO Tests ---\n')
  console.log(`Connecting to server at ${targetUrl}...\n`)

  const studentToken = jwt.sign(
    { userId: 'usr-student-101', role: 'student' },
    JWT_SECRET,
    { expiresIn: '1h' }
  )
  const adminToken = jwt.sign(
    { userId: 'usr-admin-999', role: 'admin' },
    JWT_SECRET,
    { expiresIn: '1h' }
  )

  let passedTests = 0

  // Test 1: Authenticated Student Connection
  const studentClient = Client(targetUrl, {
    auth: { token: studentToken },
    transports: ['websocket'],
  })

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Student connection timeout')), 4000)
    studentClient.on('connect', () => {
      clearTimeout(timeout)
      console.log(`✅ [PASS 1] Student connected successfully with socket id: ${studentClient.id}`)
      passedTests++
      resolve()
    })
    studentClient.on('connect_error', reject)
  })

  // Test 2: Authenticated Admin Connection
  const adminClient = Client(targetUrl, {
    auth: { token: adminToken },
    transports: ['websocket'],
  })

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Admin connection timeout')), 4000)
    adminClient.on('connect', () => {
      clearTimeout(timeout)
      console.log(`✅ [PASS 2] Admin connected successfully with socket id: ${adminClient.id}`)
      passedTests++
      resolve()
    })
    adminClient.on('connect_error', reject)
  })

  // Test 3: Unauthenticated Visitor Connection
  const visitorClient = Client(targetUrl, {
    transports: ['websocket'],
  })

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Visitor connection timeout')), 4000)
    visitorClient.on('connect', () => {
      clearTimeout(timeout)
      console.log(`✅ [PASS 3] Unauthenticated Visitor connected successfully with socket id: ${visitorClient.id}`)
      passedTests++
      resolve()
    })
    visitorClient.on('connect_error', reject)
  })

  // Test 4: Invalid Token Connection Rejection
  const badClient = Client(targetUrl, {
    auth: { token: 'invalid_malformed_token_123' },
    transports: ['websocket'],
  })

  await new Promise((resolve) => {
    badClient.on('connect_error', (err) => {
      console.log(`✅ [PASS 4] Connection rejected as expected for bad token: "${err.message}"`)
      passedTests++
      badClient.disconnect()
      resolve()
    })
    badClient.on('connect', () => {
      console.error('❌ Failed: Bad token was accepted!')
      badClient.disconnect()
      resolve()
    })
  })

  // Clean up
  studentClient.disconnect()
  adminClient.disconnect()
  visitorClient.disconnect()

  console.log('\n=============================================')
  console.log(`TOTAL REAL-TIME SOCKET TESTS PASSED: ${passedTests} / 4`)
  console.log('=============================================\n')
}

runRealTimeTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Socket test error:', err.message)
    process.exit(1)
  })
