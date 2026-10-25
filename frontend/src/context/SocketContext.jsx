import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const { user, token, isAuthenticated } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [reconnectCount, setReconnectCount] = useState(0)
  const socketRef = useRef(null)

  useEffect(() => {
    // Resolve Socket.IO base URL from VITE_API_URL or localhost:5000 (strip trailing /api)
    const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    const socketUrl = rawUrl.replace(/\/api\/?$/, '')

    // Connect with user JWT in auth handshake if logged in
    const socket = io(socketUrl, {
      auth: {
        token: token || '',
      },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log(`[Socket.IO Client] Connected to server (id: ${socket.id}) | Role: ${user?.role || 'visitor'}`)
      setIsConnected(true)
      setReconnectCount((c) => c + 1)
    })

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO Client] Disconnected from server: ${reason}`)
      setIsConnected(false)
    })

    socket.on('connect_error', (err) => {
      console.warn(`[Socket.IO Client] Connection error:`, err.message)
      setIsConnected(false)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
      setIsConnected(false)
    }
  }, [user?.email, token, isAuthenticated])

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        reconnectCount,
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    return { socket: null, isConnected: false, reconnectCount: 0 }
  }
  return context
}

export default SocketContext
