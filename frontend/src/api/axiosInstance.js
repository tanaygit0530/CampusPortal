import axios from 'axios'

// Centralized Axios instance pointing to the Express server
const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const resolvedBaseUrl = rawApiUrl.endsWith('/api')
  ? rawApiUrl
  : `${rawApiUrl.replace(/\/$/, '')}/api`

const api = axios.create({
  baseURL: resolvedBaseUrl,
  timeout: 45000,
})

// Request interceptor — attaches the JWT token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor — handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      // Clear expired credentials
      localStorage.removeItem('token')
      localStorage.removeItem('user')

      // Avoid redirect loops if already on login or register
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.startsWith('/login') &&
        !window.location.pathname.startsWith('/register')
      ) {
        window.location.href = '/login?expired=true'
      }
    }
    return Promise.reject(error)
  }
)

export default api
