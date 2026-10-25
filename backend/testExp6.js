const { app, connectDB } = require('./server')
const mongoose = require('mongoose')
const User = require('./models/User')

async function runExp6Tests() {
  console.log('--- Starting Experiment 6 Full Flow Tests (JWT & Role Authorization) ---\n')

  await connectDB()
  // Brief delay for connection
  await new Promise((res) => setTimeout(res, 1000))

  const testPort = 5098
  const server = app.listen(testPort)
  const baseUrl = `http://localhost:${testPort}/api/auth`

  let studentToken = ''
  let adminToken = ''
  let studentEmail = 'student_exp6@college.edu'
  let adminEmail = 'admin_exp6@college.edu'
  let passedCount = 0
  let failedCount = 0

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`)
      passedCount++
    } else {
      console.log(`❌ [FAIL] ${testName} - ${details}`)
      failedCount++
    }
  }

  try {
    // Cleanup prior test accounts
    await User.deleteMany({ email: { $in: [studentEmail, adminEmail] } })

    // -------------------------------------------------------------
    // Step 1: Register Student Account
    // -------------------------------------------------------------
    const regStudentRes = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Rohan Verma',
        email: studentEmail,
        password: 'studentPassword123',
        role: 'student',
      }),
    })
    const regStudentData = await regStudentRes.json()
    assert(
      regStudentRes.status === 201 &&
        regStudentData.email === studentEmail &&
        regStudentData.role === 'student' &&
        !regStudentData.password,
      'Step 1: Register Student Account (201 Created, Role: student)',
      `Status: ${regStudentRes.status}, Body: ${JSON.stringify(regStudentData)}`
    )

    // -------------------------------------------------------------
    // Step 2: Register Admin Account
    // -------------------------------------------------------------
    const regAdminRes = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Priya Administrator',
        email: adminEmail,
        password: 'adminPassword123',
        role: 'admin',
      }),
    })
    const regAdminData = await regAdminRes.json()
    assert(
      regAdminRes.status === 201 &&
        regAdminData.email === adminEmail &&
        regAdminData.role === 'admin' &&
        !regAdminData.password,
      'Step 2: Register Admin Account (201 Created, Role: admin)',
      `Status: ${regAdminRes.status}, Body: ${JSON.stringify(regAdminData)}`
    )

    // -------------------------------------------------------------
    // Step 3: Log in as Student
    // -------------------------------------------------------------
    const loginStudentRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: studentEmail,
        password: 'studentPassword123',
      }),
    })
    const loginStudentData = await loginStudentRes.json()
    studentToken = loginStudentData.token || ''
    assert(
      loginStudentRes.status === 200 &&
        Boolean(studentToken) &&
        loginStudentData.user?.role === 'student',
      'Step 3: Log in as Student (200 OK, JWT Token returned)',
      `Status: ${loginStudentRes.status}, Token: ${Boolean(studentToken)}`
    )

    // -------------------------------------------------------------
    // Step 4: Access Protected Dashboard as Student
    // -------------------------------------------------------------
    const studentDashRes = await fetch(`${baseUrl}/dashboard`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` },
    })
    const studentDashData = await studentDashRes.json()
    assert(
      studentDashRes.status === 200 &&
        studentDashData.user?.role === 'student' &&
        studentDashData.user?.email === studentEmail,
      'Step 4: Access Protected Dashboard with Student Token (200 OK)',
      `Status: ${studentDashRes.status}, Message: ${studentDashData.message}`
    )

    // -------------------------------------------------------------
    // Step 5: Try Accessing Admin-Only Route as Student (Should be Denied)
    // -------------------------------------------------------------
    const studentAdminRes = await fetch(`${baseUrl}/admin-dashboard`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` },
    })
    const studentAdminData = await studentAdminRes.json()
    assert(
      studentAdminRes.status === 403 &&
        studentAdminData.message.includes('Access denied'),
      'Step 5: Student Accessing Admin Route (403 Forbidden Correctly Denied)',
      `Status: ${studentAdminRes.status}, Message: ${studentAdminData.message}`
    )

    // -------------------------------------------------------------
    // Step 6: Log in as Admin
    // -------------------------------------------------------------
    const loginAdminRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: adminEmail,
        password: 'adminPassword123',
      }),
    })
    const loginAdminData = await loginAdminRes.json()
    adminToken = loginAdminData.token || ''
    assert(
      loginAdminRes.status === 200 &&
        Boolean(adminToken) &&
        loginAdminData.user?.role === 'admin',
      'Step 6: Log in as Admin (200 OK, Admin JWT Token returned)',
      `Status: ${loginAdminRes.status}, Token: ${Boolean(adminToken)}`
    )

    // -------------------------------------------------------------
    // Step 7: Access Admin-Only Route as Admin (Should Succeed)
    // -------------------------------------------------------------
    const adminDashRes = await fetch(`${baseUrl}/admin-dashboard`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    const adminDashData = await adminDashRes.json()
    assert(
      adminDashRes.status === 200 &&
        adminDashData.user?.role === 'admin' &&
        adminDashData.access.includes('Admin Privilege Level'),
      'Step 7: Admin Accessing Admin Route (200 OK Succeeds)',
      `Status: ${adminDashRes.status}, Message: ${adminDashData.message}`
    )

    // -------------------------------------------------------------
    // Step 8: Security Edge Cases
    // -------------------------------------------------------------
    // 8a: Correct email, wrong password
    const wrongPassRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: studentEmail, password: 'wrongPassword999' }),
    })
    const wrongPassData = await wrongPassRes.json()
    assert(
      wrongPassRes.status === 401 && wrongPassData.message === 'Invalid credentials',
      'Step 8a: Correct Email, Wrong Password (401 Invalid Credentials)',
      `Status: ${wrongPassRes.status}`
    )

    // 8b: Protected route with no token
    const noTokenRes = await fetch(`${baseUrl}/dashboard`, { method: 'GET' })
    const noTokenData = await noTokenRes.json()
    assert(
      noTokenRes.status === 401 && noTokenData.message.includes('No token provided'),
      'Step 8b: Protected Route with No Token (401 Rejected)',
      `Status: ${noTokenRes.status}`
    )

    // 8c: Protected route with corrupted token
    const corruptedRes = await fetch(`${baseUrl}/dashboard`, {
      method: 'GET',
      headers: { Authorization: 'Bearer corrupted_token_xyz_123' },
    })
    const corruptedData = await corruptedRes.json()
    assert(
      corruptedRes.status === 401 && corruptedData.message.includes('Invalid or expired token'),
      'Step 8c: Protected Route with Corrupted Token (401 Rejected)',
      `Status: ${corruptedRes.status}`
    )

  } catch (err) {
    console.error('Error running Exp 6 tests:', err)
  } finally {
    server.close()
    await mongoose.connection.close()
    console.log('\n=============================================')
    console.log(`TOTAL EXP 6 TESTS PASSED: ${passedCount} / ${passedCount + failedCount}`)
    console.log('=============================================\n')
    process.exit(failedCount > 0 ? 1 : 0)
  }
}

runExp6Tests()
