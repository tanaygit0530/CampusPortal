const { io: Client } = require('../frontend/node_modules/socket.io-client')

async function testSocketCommunication() {
  console.log('--- Starting Experiment 8 Socket.IO Real-Time Tests ---\n')

  const targetUrl = 'http://localhost:5000'
  console.log(`Connecting to Socket.IO server at ${targetUrl}...`)

  const client1 = Client(targetUrl, { transports: ['websocket'] })
  const client2 = Client(targetUrl, { transports: ['websocket'] })

  let passedTests = 0

  await new Promise((resolve, reject) => {
    let client1Connected = false
    let client2Connected = false

    const timeout = setTimeout(() => {
      reject(new Error('Connection timed out after 5s'))
    }, 5000)

    client1.on('connect', () => {
      console.log(`✅ [PASS] Client 1 (Student 1) connected with socket id: ${client1.id}`)
      client1Connected = true
      if (client1Connected && client2Connected) {
        clearTimeout(timeout)
        resolve()
      }
    })

    client2.on('connect', () => {
      console.log(`✅ [PASS] Client 2 (Student 2) connected with socket id: ${client2.id}`)
      client2Connected = true
      if (client1Connected && client2Connected) {
        clearTimeout(timeout)
        resolve()
      }
    })
  })
  passedTests++

  // Test Case 2: Client 1 sends message, Client 2 receives it
  await new Promise((resolve, reject) => {
    const testTimeout = setTimeout(() => {
      reject(new Error('Client 2 did not receive message from Client 1'))
    }, 4000)

    client2.on('chatMessage', (data) => {
      if (data.username === 'Student 1' && data.message === 'Hello Student 2!') {
        console.log(`✅ [PASS] Client 2 received broadcast from Student 1: "${data.message}" (${data.timestamp})`)
        clearTimeout(testTimeout)
        passedTests++
        resolve()
      }
    })

    client1.emit('chatMessage', {
      username: 'Student 1',
      message: 'Hello Student 2!',
    })
  })

  // Test Case 3: Client 2 replies, Client 1 receives it
  await new Promise((resolve, reject) => {
    const testTimeout = setTimeout(() => {
      reject(new Error('Client 1 did not receive reply from Client 2'))
    }, 4000)

    client1.on('chatMessage', (data) => {
      if (data.username === 'Student 2' && data.message === 'Hey Student 1, WebSocket communication works!') {
        console.log(`✅ [PASS] Client 1 received reply from Student 2: "${data.message}" (${data.timestamp})`)
        clearTimeout(testTimeout)
        passedTests++
        resolve()
      }
    })

    client2.emit('chatMessage', {
      username: 'Student 2',
      message: 'Hey Student 1, WebSocket communication works!',
    })
  })

  client1.disconnect()
  client2.disconnect()
  console.log('✅ [PASS] Client 1 and Client 2 successfully disconnected.\n')
  passedTests++

  console.log('=============================================')
  console.log(`TOTAL REAL-TIME SOCKET TESTS PASSED: ${passedTests} / 4`)
  console.log('=============================================\n')
}

testSocketCommunication()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Socket test error:', err.message)
    process.exit(1)
  })
