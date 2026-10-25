import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from '../context/AuthContext'

export default function Chat() {
  const { user } = useAuth()
  const [username, setUsername] = useState(user?.name || '')
  const [messageInput, setMessageInput] = useState('')
  const [messages, setMessages] = useState([])
  const [isConnected, setIsConnected] = useState(false)

  const socketRef = useRef(null)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Resolve Socket URL from VITE_API_URL (without /api path)
    const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    const socketUrl = rawUrl.replace(/\/api\/?$/, '')

    // Create Socket.IO connection once
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
    })
    socketRef.current = socket

    socket.on('connect', () => {
      setIsConnected(true)
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    // Receive incoming chat messages from server broadcast
    socket.on('chatMessage', (data) => {
      setMessages((prev) => [...prev, data])
    })

    // Cleanup on unmount
    return () => {
      socket.disconnect()
    }
  }, [])

  // Update username if user logs in while on page
  useEffect(() => {
    if (user?.name && !username) {
      setUsername(user.name)
    }
  }, [user])

  const handleSendMessage = (e) => {
    e.preventDefault()
    const trimmedUser = username.trim()
    const trimmedMsg = messageInput.trim()

    // Validate non-empty
    if (!trimmedUser || !trimmedMsg) return

    if (socketRef.current) {
      socketRef.current.emit('chatMessage', {
        username: trimmedUser,
        message: trimmedMsg,
      })
      setMessageInput('')
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      {/* Header */}
      <div className="mb-8 text-center">
        <span className="font-mono text-[13px] uppercase tracking-[0.2em] text-rust">
          Real-Time WebSocket Communication
        </span>
        <h1 className="mt-2 font-display text-4xl font-semibold text-ink">
          Real-Time Chat Application
        </h1>
        <p className="mt-2 font-body text-sm text-slate">
          Send and receive instant broadcast messages without page refreshes
        </p>

        {/* Connection Status Line */}
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-4 py-1.5 shadow-xs">
          <span
            className={`h-2.5 w-2.5 rounded-full transition-colors ${
              isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rust animate-ping'
            }`}
          />
          <span className="font-mono text-xs uppercase tracking-wider text-slate">
            Status:
          </span>
          <span
            className={`font-mono text-xs font-semibold ${
              isConnected ? 'text-emerald-700' : 'text-rust'
            }`}
          >
            {isConnected ? 'Connected' : 'Connecting...'}
          </span>
        </div>
      </div>

      {/* Main Chat Card */}
      <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-sm sm:p-8">
        {/* Username Input Bar */}
        <div className="mb-6">
          <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-slate">
            Username (Type or edit your display handle)
          </label>
          <div className="relative">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. Student 1, Student 2, Admin"
              className="w-full rounded-xl border border-ink/15 bg-paper/40 px-4 py-2.5 font-body text-sm text-ink outline-none transition-colors focus:border-rust focus:bg-white"
            />
            {user?.role && (
              <span className="pointer-events-none absolute right-3 top-2.5 rounded-md bg-ink/5 px-2 py-0.5 font-mono text-[11px] uppercase text-slate">
                {user.role}
              </span>
            )}
          </div>
        </div>

        {/* Scrollable Messages Display Box */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wider text-slate">
              Live Messages Area
            </span>
            <span className="font-mono text-[11px] text-slate">
              {messages.length} message{messages.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="h-72 overflow-y-auto rounded-2xl border border-ink/15 bg-paper/30 p-4 shadow-inner">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <span className="font-display text-2xl text-ink/30">💬</span>
                <p className="mt-2 font-mono text-xs text-slate">
                  No messages yet. Send a message to start the conversation!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg, index) => {
                  const isCurrentUser =
                    username.trim() &&
                    msg.username.trim().toLowerCase() === username.trim().toLowerCase()

                  return (
                    <div
                      key={index}
                      className={`flex flex-col ${
                        isCurrentUser ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-xs sm:max-w-[75%] ${
                          isCurrentUser
                            ? 'border border-amber/40 bg-amber/15 text-ink'
                            : 'border border-ink/10 bg-white text-ink'
                        }`}
                      >
                        <div className="mb-1 flex items-center justify-between gap-3 border-b border-ink/10 pb-1">
                          <span
                            className={`font-mono text-[11px] font-bold ${
                              isCurrentUser ? 'text-rust' : 'text-ink'
                            }`}
                          >
                            {msg.username}
                          </span>
                          <span className="font-mono text-[10px] text-slate">
                            {msg.timestamp || 'Just now'}
                          </span>
                        </div>
                        <p className="break-words font-body text-sm leading-relaxed">
                          <span className="font-mono text-xs text-slate mr-1.5 font-medium">
                            {msg.username}:
                          </span>
                          {msg.message}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Message Input & Send Form */}
        <form onSubmit={handleSendMessage} className="space-y-3">
          <div className="flex gap-3">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type your message here..."
              disabled={!isConnected}
              className="flex-1 rounded-full border border-ink/15 bg-white px-5 py-3 font-body text-sm text-ink outline-none transition-colors focus:border-rust disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!isConnected || !messageInput.trim() || !username.trim()}
              className="rounded-full bg-ink px-7 py-3 font-body text-sm font-semibold text-paper transition-all hover:bg-ink-light disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send
            </button>
          </div>
          <p className="font-mono text-[11px] text-slate">
            Messages are broadcasted live to all connected browser tabs via WebSockets.
          </p>
        </form>
      </div>
    </div>
  )
}
