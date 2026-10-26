const { io } = require('socket.io-client')

const API_BASE = 'http://localhost:5000/api'
const SOCKET_BASE = 'http://localhost:5000'

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  const res = await fetch(url, { ...options, headers })
  let data
  try {
    data = await res.json()
  } catch {
    data = null
  }
  return { status: res.status, ok: res.ok, data }
}

async function runTests() {
  console.log('====================================================')
  console.log('🧪 Starting End-to-End Real-Time & Backend Test Suite')
  console.log('====================================================\n')

  let passed = 0
  let failed = 0

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`)
      passed++
    } else {
      console.error(`  ❌ FAIL: ${message}`)
      failed++
    }
  }

  // 1. Stats endpoint works and returns numeric metrics
  console.log('\n--- 1. Testing GET /api/stats ---')
  const statsRes = await request('/stats')
  assert(statsRes.status === 200, 'GET /api/stats returned 200 OK')
  assert(typeof statsRes.data.totalEvents === 'number', 'totalEvents is a number')
  assert(typeof statsRes.data.totalRegistrations === 'number', 'totalRegistrations is a number')
  assert(typeof statsRes.data.seatsFilled === 'number', 'seatsFilled is a number')

  // 2. Bootstrap Admin Login
  console.log('\n--- 2. Bootstrap Admin Authentication ---')
  const adminLoginRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'admin@campuspass.edu',
      password: 'AdminPassword123!',
    }),
  })
  assert(adminLoginRes.status === 200, 'Admin logged in with bootstrap credentials')
  assert(adminLoginRes.data?.user?.role === 'admin', 'Admin user has role: admin')
  const adminToken = adminLoginRes.data?.token
  assert(Boolean(adminToken), 'JWT token returned for admin')

  // 3. Student Registration & Login
  console.log('\n--- 3. Student Registration & Restrictions ---')
  const testStudentEmail = `student_${Date.now()}@college.edu`
  const studentSignupRes = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Rohan Verma',
      email: testStudentEmail,
      password: 'Password123!',
      role: 'admin', // Attack attempt: try to elevate to admin on public signup
    }),
  })
  assert(studentSignupRes.status === 201, 'Student account created (201 Created)')
  assert(studentSignupRes.data?.user?.role === 'student', 'Privilege elevation blocked: user role is student')
  const studentToken = studentSignupRes.data?.token

  // Try duplicate student signup
  const dupSignupRes = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Rohan Verma Duplicate',
      email: testStudentEmail,
      password: 'Password123!',
    }),
  })
  assert(dupSignupRes.status === 409, 'Duplicate signup rejected with 409 Conflict')

  // Verify Student Profile
  const profileRes = await request('/auth/profile', {
    headers: { Authorization: `Bearer ${studentToken}` },
  })
  assert(profileRes.status === 200, 'GET /api/auth/profile succeeded with student JWT')
  assert(profileRes.data.email === testStudentEmail, 'Profile email matches')
  assert(!profileRes.data.password, 'Password omitted from profile response')

  // 4. Role-Based Access Control
  console.log('\n--- 4. Role-Based Access Control (RBAC) ---')
  // Student trying admin route
  const studentAdminAttempt = await request('/events', {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({
      title: 'Unauthorized Event',
      description: 'Hacked',
      category: 'Technical',
      date: 'Dec 01, 2026',
      venue: 'Auditorium',
      totalSeats: 50,
    }),
  })
  assert(studentAdminAttempt.status === 403, 'Student blocked from creating event (403 Forbidden)')

  // Unauthenticated user trying protected route
  const unauthAttempt = await request('/registrations/my')
  assert(unauthAttempt.status === 401, 'Unauthenticated request blocked (401 Unauthorized)')

  // Insecure generic user routes locked down
  const unauthUsersAttempt = await request('/users')
  assert(unauthUsersAttempt.status === 401, 'Old generic /api/users is protected from public access')

  // 5. Admin Event Creation & Socket Emission
  console.log('\n--- 5. Admin Event Creation & Real-Time Broadcasting ---')
  // Connect a test socket client as visitor
  const visitorSocket = io(SOCKET_BASE, { auth: { token: '' } })
  const adminSocket = io(SOCKET_BASE, { auth: { token: adminToken } })

  let eventCreatedReceived = false
  visitorSocket.on('event:created', (data) => {
    eventCreatedReceived = true
  })

  // Create event with 2 seats to test race conditions
  const eventRes = await request('/events', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      title: `Race Condition Hackathon ${Date.now()}`,
      tagline: 'Only 2 seats available!',
      description: 'High intensity coding sprint',
      category: 'Technical',
      date: '2026-11-20',
      time: '10:00 AM',
      registrationDeadline: '2026-11-19',
      venue: 'Main Lab 1',
      mode: 'on-campus',
      totalSeats: 2,
      isTeamEvent: false,
      eligibility: 'All students',
    }),
  })
  assert(eventRes.status === 201, 'Admin created event successfully (201 Created)')
  const createdEvent = eventRes.data
  const testEventId = createdEvent._id

  // Wait 500ms for socket broadcast
  await new Promise((r) => setTimeout(r, 600))
  assert(eventCreatedReceived, 'Socket event "event:created" was broadcast to visitor client')

  // 6. Admin can Close and Reopen event
  console.log('\n--- 6. Admin Close and Reopen Event ---')
  const closeRes = await request(`/events/${testEventId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ status: 'closed' }),
  })
  assert(closeRes.status === 200 && closeRes.data.status === 'closed', 'Admin closed event')

  // Student cannot register when closed
  const regClosedRes = await request('/registrations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({
      event: testEventId,
      phone: '9876543210',
      department: 'CS',
      year: '3rd Year',
      rulesAccepted: true,
    }),
  })
  assert(regClosedRes.status === 400, 'Registration blocked on closed event (400 Bad Request)')

  // Admin reopens event
  await request(`/events/${testEventId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ status: 'open' }),
  })

  // 7. Student Registration & Atomic Seat Decrement
  console.log('\n--- 7. Registration & Atomic Seat Decrement ---')
  let seatUpdateReceived = false
  visitorSocket.on('event:seatsUpdated', (data) => {
    if (data.eventId === testEventId) seatUpdateReceived = true
  })

  const regRes = await request('/registrations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({
      event: testEventId,
      phone: '9876543210',
      department: 'Computer Science',
      year: '3rd Year',
      rulesAccepted: true,
    }),
  })
  assert(regRes.status === 201, 'Student registered successfully (201 Created)')
  const regId = regRes.data._id

  await new Promise((r) => setTimeout(r, 600))
  assert(seatUpdateReceived, 'Socket event "event:seatsUpdated" received across clients')

  // Check event seats
  const eventAfter1Reg = await request(`/events/${testEventId}`)
  assert(eventAfter1Reg.data.seatsLeft === 1, 'Event seatsLeft decremented atomically to 1')

  // Try duplicate registration by same student
  const dupRegRes = await request('/registrations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({
      event: testEventId,
      phone: '9876543210',
      department: 'Computer Science',
      year: '3rd Year',
      rulesAccepted: true,
    }),
  })
  assert(dupRegRes.status === 409, 'Double registration blocked with 409 Conflict')

  // Admin cannot register for events
  const adminRegRes = await request('/registrations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      event: testEventId,
      phone: '9876543210',
      department: 'Staff',
      year: 'Faculty',
      rulesAccepted: true,
    }),
  })
  assert(adminRegRes.status === 403, 'Admin blocked from registering (403 Forbidden)')

  // 8. Concurrent Race Condition: Two students compete for the last 1 seat
  console.log('\n--- 8. Atomic Race Condition Test (Two Students for Last Seat) ---')
  // Create student 2 and student 3
  const s2Email = `student2_${Date.now()}@college.edu`
  const s3Email = `student3_${Date.now()}@college.edu`

  const [s2Res, s3Res] = await Promise.all([
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Student Two', email: s2Email, password: 'Password123!' }),
    }),
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Student Three', email: s3Email, password: 'Password123!' }),
    }),
  ])

  const s2Token = s2Res.data.token
  const s3Token = s3Res.data.token

  // Simultaneously fire registration requests for the 1 remaining seat
  const [race1, race2] = await Promise.all([
    request('/registrations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${s2Token}` },
      body: JSON.stringify({
        event: testEventId,
        phone: '9876543211',
        department: 'IT',
        year: '2nd Year',
        rulesAccepted: true,
      }),
    }),
    request('/registrations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${s3Token}` },
      body: JSON.stringify({
        event: testEventId,
        phone: '9876543212',
        department: 'Mechanical',
        year: '2nd Year',
        rulesAccepted: true,
      }),
    }),
  ])

  const succeededCount = [race1, race2].filter((r) => r.status === 201).length
  const failedCount = [race1, race2].filter((r) => r.status === 400).length
  assert(succeededCount === 1, 'Atomic conditional check: exactly 1 student took the last seat')
  assert(failedCount === 1, 'Second competing student received 400 ("No seats left") without overbooking')

  const eventAfterRace = await request(`/events/${testEventId}`)
  assert(eventAfterRace.data.seatsLeft === 0, 'Event seatsLeft is 0 and not negative')
  assert(eventAfterRace.data.status === 'closed', 'Event automatically marked closed when seats hit 0')

  // 9. Cancellation & Seat Restoration
  console.log('\n--- 9. Student Cancellation & Seat Restoration ---')
  const cancelRes = await request(`/registrations/my/${regId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${studentToken}` },
  })
  assert(cancelRes.status === 200, 'Student cancelled their registration (200 OK)')

  const eventAfterCancel = await request(`/events/${testEventId}`)
  assert(eventAfterCancel.data.seatsLeft === 1, 'Seat restored atomically (+1) to 1')
  assert(eventAfterCancel.data.status === 'open', 'Event automatically reopened when seat freed')

  // Cannot cancel twice
  const cancelAgainRes = await request(`/registrations/my/${regId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${studentToken}` },
  })
  assert(cancelAgainRes.status === 404, 'Cannot cancel already cancelled registration (404/blocked)')

  // 10. Admin Registrants Table & CSV Data
  console.log('\n--- 10. Admin Event Registrants Endpoint ---')
  const adminRegistrantsRes = await request(`/registrations/event/${testEventId}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  })
  assert(adminRegistrantsRes.status === 200, 'Admin can list registrants for event')
  assert(Array.isArray(adminRegistrantsRes.data), 'Returns array of attendee records')

  // 11. Cascade Deletion of Event and Registrations
  console.log('\n--- 11. Event Deletion Cascade ---')
  let eventDeletedReceived = false
  visitorSocket.on('event:deleted', (data) => {
    if (data.eventId === testEventId) eventDeletedReceived = true
  })

  const deleteRes = await request(`/events/${testEventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  })
  assert(deleteRes.status === 200, 'Admin deleted event and associated registrations')

  await new Promise((r) => setTimeout(r, 600))
  assert(eventDeletedReceived, 'Socket event "event:deleted" received by connected clients')

  // Verify event is gone
  const getDeletedEvent = await request(`/events/${testEventId}`)
  assert(getDeletedEvent.status === 404, 'Deleted event returns 404 Not Found')

  // Disconnect sockets
  visitorSocket.disconnect()
  adminSocket.disconnect()

  console.log('\n====================================================')
  console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`)
  console.log('====================================================\n')

  process.exit(failed > 0 ? 1 : 0)
}

runTests().catch((err) => {
  console.error('Fatal test error:', err)
  process.exit(1)
})
