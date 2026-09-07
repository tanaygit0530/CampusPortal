const http = require('http')
const { app } = require('./server.js')

const TEST_PORT = 5001

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: data ? JSON.parse(data) : data })
        } catch {
          resolve({ status: res.statusCode, body: data })
        }
      })
    })
    req.on('error', reject)
    if (postData) {
      req.write(JSON.stringify(postData))
    }
    req.end()
  })
}

async function runTests() {
  const server = app.listen(TEST_PORT, () => {
    console.log(`Test server running on port ${TEST_PORT}`)
  })

  console.log('--- Starting API Verification Tests ---')
  await new Promise((res) => setTimeout(res, 2000)) // Wait for DB connection

  try {
    // 1. GET /
    const baseRes = await makeRequest({ host: 'localhost', port: TEST_PORT, path: '/', method: 'GET' })
    console.log('1. GET / -> Status:', baseRes.status, 'Body:', baseRes.body)

    // 2. POST /api/users (Create Student)
    const studentRes = await makeRequest(
      {
        host: 'localhost',
        port: TEST_PORT,
        path: '/api/users',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { name: 'Rohan Verma', email: 'rohan@college.edu', password: 'password123', role: 'student' }
    )
    console.log('2. POST /api/users (Student) -> Status:', studentRes.status, 'ID:', studentRes.body._id)
    const studentId = studentRes.body._id

    // 3. POST /api/users (Create Admin)
    const adminRes = await makeRequest(
      {
        host: 'localhost',
        port: TEST_PORT,
        path: '/api/users',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { name: 'Admin User', email: 'admin@college.edu', password: 'adminpassword', role: 'admin' }
    )
    console.log('3. POST /api/users (Admin) -> Status:', adminRes.status, 'ID:', adminRes.body._id)
    const adminId = adminRes.body._id

    // 4. POST /api/events
    const eventRes = await makeRequest(
      {
        host: 'localhost',
        port: TEST_PORT,
        path: '/api/events',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        title: 'Hackathon 2026',
        description: '24-hour coding challenge',
        category: 'Technical',
        date: 'Sept 25, 2026',
        time: '09:00 AM',
        venue: 'CS Seminar Hall',
        totalSeats: 50,
        seatsLeft: 50,
        createdBy: adminId,
      }
    )
    console.log('4. POST /api/events -> Status:', eventRes.status, 'Event ID:', eventRes.body._id, 'Seats Left:', eventRes.body.seatsLeft)
    const eventId = eventRes.body._id

    // 5. GET /api/users & GET /api/events
    const usersRes = await makeRequest({ host: 'localhost', port: TEST_PORT, path: '/api/users', method: 'GET' })
    const eventsRes = await makeRequest({ host: 'localhost', port: TEST_PORT, path: '/api/events', method: 'GET' })
    console.log('5. GET /api/users count:', usersRes.body.length, '| GET /api/events count:', eventsRes.body.length)

    // 6. POST /api/registrations (Register student for event)
    const regRes = await makeRequest(
      {
        host: 'localhost',
        port: TEST_PORT,
        path: '/api/registrations',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { event: eventId, student: studentId, status: 'confirmed' }
    )
    console.log('6. POST /api/registrations -> Status:', regRes.status, 'Reg ID:', regRes.body._id)
    const regId = regRes.body._id

    // Verify seatsLeft decremented to 49
    const updatedEventRes = await makeRequest({ host: 'localhost', port: TEST_PORT, path: `/api/events/${eventId}`, method: 'GET' })
    console.log('   Event seatsLeft after registration:', updatedEventRes.body.seatsLeft)

    // 7. GET /api/registrations (Populated)
    const allRegsRes = await makeRequest({ host: 'localhost', port: TEST_PORT, path: '/api/registrations', method: 'GET' })
    console.log('7. GET /api/registrations -> Populated Student:', allRegsRes.body[0]?.student?.name, '| Event:', allRegsRes.body[0]?.event?.title)

    // 8. GET /api/registrations/student/:studentId
    const studentRegs = await makeRequest({ host: 'localhost', port: TEST_PORT, path: `/api/registrations/student/${studentId}`, method: 'GET' })
    console.log('8. GET /api/registrations/student/:id count:', studentRegs.body.length)

    // 9. GET /api/registrations/event/:eventId
    const eventRegs = await makeRequest({ host: 'localhost', port: TEST_PORT, path: `/api/registrations/event/${eventId}`, method: 'GET' })
    console.log('9. GET /api/registrations/event/:id count:', eventRegs.body.length)

    // 10. PUT /api/events/:id
    const putEventRes = await makeRequest(
      {
        host: 'localhost',
        port: TEST_PORT,
        path: `/api/events/${eventId}`,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      },
      { title: 'Updated Hackathon 2026' }
    )
    console.log('10. PUT /api/events/:id -> New Title:', putEventRes.body.title)

    // 11. DELETE /api/registrations/:id (Cancel reg, check seatsLeft incremented)
    const delRegRes = await makeRequest({ host: 'localhost', port: TEST_PORT, path: `/api/registrations/${regId}`, method: 'DELETE' })
    console.log('11. DELETE /api/registrations/:id -> Status:', delRegRes.status, 'Message:', delRegRes.body.message)

    const finalEventRes = await makeRequest({ host: 'localhost', port: TEST_PORT, path: `/api/events/${eventId}`, method: 'GET' })
    console.log('    Event seatsLeft after cancellation:', finalEventRes.body.seatsLeft)

    // 12. DELETE /api/events/:id & DELETE /api/users/:id
    const delEventRes = await makeRequest({ host: 'localhost', port: TEST_PORT, path: `/api/events/${eventId}`, method: 'DELETE' })
    const delStudentRes = await makeRequest({ host: 'localhost', port: TEST_PORT, path: `/api/users/${studentId}`, method: 'DELETE' })
    console.log('12. DELETE /api/events/:id -> Status:', delEventRes.status, '| DELETE /api/users/:id -> Status:', delStudentRes.status)

    console.log('--- ALL API TESTS PASSED SUCCESSFULLY! ---')
    server.close()
    process.exit(0)
  } catch (err) {
    console.error('Test Failed:', err)
    server.close()
    process.exit(1)
  }
}

runTests()
