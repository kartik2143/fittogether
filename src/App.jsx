import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { Layout } from './components/layout/Layout'

import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import Dashboard from './pages/Dashboard'
import DailyHealthTracker from './pages/DailyHealthTracker'
import DailyWorkoutTracker from './pages/DailyWorkoutTracker'
import DailyDietTracker from './pages/DailyDietTracker'
import MyProgress from './pages/MyProgress'
import Profiles from './pages/Profiles'
import ProfileView from './pages/ProfileView'
import Settings from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected — all share the Layout shell */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="health" element={<DailyHealthTracker />} />
            <Route path="workout" element={<DailyWorkoutTracker />} />
            <Route path="diet" element={<DailyDietTracker />} />
            <Route path="progress" element={<MyProgress />} />
            <Route path="profiles" element={<Profiles />} />
            <Route path="profiles/:userId" element={<ProfileView />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
