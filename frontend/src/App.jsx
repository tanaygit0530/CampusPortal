import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import { SocketProvider } from './context/SocketContext'
import { EventProvider } from './context/EventContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import ToastContainer from './components/ToastContainer'
import ErrorBoundary from './components/ErrorBoundary'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import EventDetail from './pages/EventDetail'
import Profile from './pages/Profile'
import NotFound from './pages/NotFound'
import AdminDashboard from './pages/admin/AdminDashboard'
import EventForm from './pages/admin/EventForm'
import EventRegistrants from './pages/admin/EventRegistrants'

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <SocketProvider>
            <EventProvider>
              <BrowserRouter>
                <div className="min-h-screen bg-paper font-body text-charcoal">
                  <Navbar />
                  <Routes>
                    {/* Public Routes (Anyone can view events and details) */}
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/events/:id" element={<EventDetail />} />

                    {/* Student Protected Routes */}
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      }
                    />

                    {/* Admin Protected Routes */}
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute requireRole="admin">
                          <AdminDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/events/new"
                      element={
                        <ProtectedRoute requireRole="admin">
                          <EventForm />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/events/:id/edit"
                      element={
                        <ProtectedRoute requireRole="admin">
                          <EventForm />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/events/:id/registrants"
                      element={
                        <ProtectedRoute requireRole="admin">
                          <EventRegistrants />
                        </ProtectedRoute>
                      }
                    />

                    {/* 404 Catch-All Page */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>

                  {/* Floating Real-Time Toast Alerts */}
                  <ToastContainer />
                </div>
              </BrowserRouter>
            </EventProvider>
          </SocketProvider>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
