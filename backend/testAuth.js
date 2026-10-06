const { app, connectDB } = require('./server')
const mongoose = require('mongoose')
const User = require('./models/User')
const jwt = require('jsonwebtoken')
const { protect, isAdmin } = require('./middleware/authMiddleware')

async function runAuthTests() {
  console.log('--- Starting Experiment 5 Auth API Security Tests ---\n')

  await connectDB()
  // Wait brief moment for Mongoose connection to establish
  await new Promise((res) => setTimeout(res, 1000))

  const testPort = 5099
  const server = app.listen(testPort)
  const baseUrl = `http://localhost:${testPort}/api/auth`

  let testToken = ''
  let testUserId = ''
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
    // Cleanup prior test user
    await User.deleteMany({ email: { $in: ['ananya@college.edu', 'invalid_user@test.com', 'admin_test@college.edu'] } })

    // -------------------------------------------------------------
    // Test Case 1: Register User (Step 11 & Positive Test)
    // -------------------------------------------------------------
    const regRes = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ananya Sharma',
        email: 'ananya@college.edu',
        password: 'test123',
        role: 'student',
      }),
    })
    const regData = await regRes.json()
    assert(
      regRes.status === 201 && regData._id && regData.name === 'Ananya Sharma' && !regData.password,
      'Test 1: User Registration (201 Created, Password Excluded)',
      `Status: ${regRes.status}, Body: ${JSON.stringify(regData)}`
    )

    // -------------------------------------------------------------
    // Test Case 2: Login User & Receive JWT Token (Step 11)
    // -------------------------------------------------------------
    const loginRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'ananya@college.edu',
        password: 'test123',
      }),
    })
    const loginData = await loginRes.json()
    testToken = loginData.token || ''
    testUserId = loginData.user?.id || ''
    assert(
      loginRes.status === 200 && Boolean(testToken) && loginData.user?.email === 'ananya@college.edu',
      'Test 2: User Login (200 OK, JWT Token Generated)',
      `Status: ${loginRes.status}, Body: ${JSON.stringify(loginData)}`
    )

    // -------------------------------------------------------------
    // Test Case 3: GET /profile with Valid JWT Token (Step 11)
    // -------------------------------------------------------------
    const profileRes = await fetch(`${baseUrl}/profile`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${testToken}`,
      },
    })
    const profileData = await profileRes.json()
    assert(
      profileRes.status === 200 && profileData.email === 'ananya@college.edu' && !profileData.password,
      'Test 3: Protected Profile Access with Valid JWT (200 OK)',
      `Status: ${profileRes.status}, Body: ${JSON.stringify(profileData)}`
    )

    // -------------------------------------------------------------
    // Test Case 4 (Security 1): Login with Wrong Password (Step 12)
    // -------------------------------------------------------------
    const wrongPassRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'ananya@college.edu',
        password: 'wrongpassword999',
      }),
    })
    const wrongPassData = await wrongPassRes.json()
    assert(
      wrongPassRes.status === 401 && wrongPassData.message === 'Invalid credentials',
      'Test 4 (Security 1): Login with Wrong Password (401 Invalid Credentials)',
      `Status: ${wrongPassRes.status}, Message: ${wrongPassData.message}`
    )

    // -------------------------------------------------------------
    // Test Case 5 (Security 2): GET /profile with No Auth Header (Step 12)
    // -------------------------------------------------------------
    const noTokenRes = await fetch(`${baseUrl}/profile`, {
      method: 'GET',
    })
    const noTokenData = await noTokenRes.json()
    assert(
      noTokenRes.status === 401 && noTokenData.message.includes('No token provided'),
      'Test 5 (Security 2): GET Profile without Authorization Header (401 No Token)',
      `Status: ${noTokenRes.status}, Message: ${noTokenData.message}`
    )

    // -------------------------------------------------------------
    // Test Case 6 (Security 3): GET /profile with Corrupted Token (Step 12)
    // -------------------------------------------------------------
    const corruptedTokenRes = await fetch(`${baseUrl}/profile`, {
      method: 'GET',
      headers: {
        Authorization: 'Bearer fake_corrupted_token_string_abc123',
      },
    })
    const corruptedTokenData = await corruptedTokenRes.json()
    assert(
      corruptedTokenRes.status === 401 && corruptedTokenData.message.includes('Invalid or expired token'),
      'Test 6 (Security 3): GET Profile with Corrupted Token (401 Invalid Token)',
      `Status: ${corruptedTokenRes.status}, Message: ${corruptedTokenData.message}`
    )

    // -------------------------------------------------------------
    // Test Case 7 (Security 4): Register with Invalid Input (Step 12)
    // -------------------------------------------------------------
    const invalidInputRes = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '',
        email: 'not-an-email-format',
        password: '123',
      }),
    })
    const invalidInputData = await invalidInputRes.json()
    assert(
      invalidInputRes.status === 400 && Array.isArray(invalidInputData.errors) && invalidInputData.errors.length >= 3,
      'Test 7 (Security 4): Register Input Validation Errors (400 Bad Request)',
      `Status: ${invalidInputRes.status}, Errors Count: ${invalidInputData.errors?.length}`
    )

    // -------------------------------------------------------------
    // Test Case 8: Duplicate Email Registration Prevention
    // -------------------------------------------------------------
    const dupRes = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Another Ananya',
        email: 'ananya@college.edu',
        password: 'anotherpassword',
      }),
    })
    const dupData = await dupRes.json()
    assert(
      dupRes.status === 400 && dupData.message === 'User already exists',
      'Test 8: Duplicate Email Prevention (400 User Already Exists)',
      `Status: ${dupRes.status}, Message: ${dupData.message}`
    )

    // -------------------------------------------------------------
    // Test Case 9: Admin Middleware Privilege Check
    // -------------------------------------------------------------
    let reqStudent = { user: { userId: '123', role: 'student' } }
    let reqAdmin = { user: { userId: '456', role: 'admin' } }
    let adminCheckResult = { studentForbidden: false, adminAllowed: false }

    isAdmin(reqStudent, { status: (s) => ({ json: (b) => { if (s === 403) adminCheckResult.studentForbidden = true } }) }, () => {})
    isAdmin(reqAdmin, {}, () => { adminCheckResult.adminAllowed = true })

    assert(
      adminCheckResult.studentForbidden && adminCheckResult.adminAllowed,
      'Test 9: isAdmin Middleware Privilege Enforcement (403 Non-Admin, Next Admin)',
      `Student Forbidden: ${adminCheckResult.studentForbidden}, Admin Allowed: ${adminCheckResult.adminAllowed}`
    )

    // -------------------------------------------------------------
    // Test Case 10 (Security 5): Rate Limiting Protection (Step 12)
    // -------------------------------------------------------------
    let rateLimited = false
    for (let i = 0; i < 105; i++) {
      const res = await fetch(`http://localhost:${testPort}/api/users`, { method: 'GET' })
      if (res.status === 429) {
        rateLimited = true
        break
      }
    }
    assert(
      rateLimited,
      'Test 10 (Security 5): Rate Limiter Enforcement (429 Too Many Requests)',
      `Rate Limited Triggered: ${rateLimited}`
    )

  } catch (err) {
    console.error('Error running auth tests:', err)
  } finally {
    server.close()
    await mongoose.connection.close()
    console.log('\n=============================================')
    console.log(`TOTAL SECURITY TESTS PASSED: ${passedCount} / ${passedCount + failedCount}`)
    console.log('=============================================\n')
    process.exit(failedCount > 0 ? 1 : 0)
  }
}

runAuthTests()
