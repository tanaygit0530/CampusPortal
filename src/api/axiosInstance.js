import axios from 'axios'

// Centralized Axios instance so baseURL / headers / interceptors live in one place.
// In Exp 4 this will point at the real Express server (e.g. http://localhost:5000/api).
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 8000,
})

// Request interceptor — attaches the JWT once auth exists (Exp 6).
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor — centralised error handling instead of try/catch everywhere.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API error:', error?.response?.data?.message || error.message)
    return Promise.reject(error)
  }
)

export default api
