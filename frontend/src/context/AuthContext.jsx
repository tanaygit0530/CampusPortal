import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null)
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('user')
  })

  const login = (userData, userToken = null) => {
    const formattedUser = {
      id: userData.id || userData._id || `USR-${Date.now()}`,
      name: userData.name || 'User',
      email: userData.email || '',
      role: userData.role || 'student',
    }
    setUser(formattedUser)
    setIsAuthenticated(true)
    localStorage.setItem('user', JSON.stringify(formattedUser))

    if (userToken) {
      setToken(userToken)
      localStorage.setItem('token', userToken)
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    setIsAuthenticated(false)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

export default AuthContext
