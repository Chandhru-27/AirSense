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
import Helpline from './pages/Helpline'
import ReportPollution from './pages/ReportPollution'
import { useEffect } from 'react'
import { useUser } from './lib/hooks'
import { useAuthStore } from './stores/authStore'

function App() {
  const { data: userData, isLoading: isUserLoading } = useUser();
  const { login, logout, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (userData && !isAuthenticated) {
      login(
        { id: userData.user_id, name: userData.username || 'User', email: userData.email || '' },
        localStorage.getItem('access_token') || ''
      );
    } else if (!userData && !isUserLoading && isAuthenticated) {
      // If query fails and we thought we were authenticated, logout
      logout();
    }
  }, [userData, isUserLoading, login, logout, isAuthenticated]);

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }
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
            <Route path="/helpline" element={<Helpline />} />
            <Route path="/report" element={<ReportPollution />} />
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
