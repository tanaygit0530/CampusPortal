import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { EventProvider } from './context/EventContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import EventDetail from './pages/EventDetail'
import AdminDashboard from './pages/admin/AdminDashboard'
import EventForm from './pages/admin/EventForm'
import EventRegistrants from './pages/admin/EventRegistrants'

function App() {
  return (
    <AuthProvider>
      <EventProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-paper font-body text-charcoal">
            <Navbar />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Student Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events/:id"
                element={
                  <ProtectedRoute>
                    <EventDetail />
                  </ProtectedRoute>
                }
              />

              {/* Protected Admin Routes */}
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
            </Routes>
          </div>
        </BrowserRouter>
      </EventProvider>
    </AuthProvider>
  )
}

export default App
