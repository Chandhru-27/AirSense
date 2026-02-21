import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { PublicRoute } from './components/layout/PublicRoute'
import { MainLayout } from './components/layout/MainLayout'

// Lazy load pages for better performance 
// (or just import them directly for now when creating files)
import Login from './pages/Login'
import Signup from './pages/Signup'
import Personalize from './pages/Personalize'
import Dashboard from './pages/Dashboard'
import PlanTrip from './pages/PlanTrip'
import ChatBot from './pages/ChatBot'
import Profile from './pages/Profile' 

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          {/* Routes with Sidebar Layout */}
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/plan-trip" element={<PlanTrip />} />
            <Route path="/chatbot" element={<ChatBot />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Standalone protected route without sidebar */}
          <Route path="/personalize" element={<Personalize />} />
        </Route>

        {/* Fallback */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
