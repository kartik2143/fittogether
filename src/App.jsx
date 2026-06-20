import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { ErrorBoundary } from './components/layout/ErrorBoundary'
import { Layout } from './components/layout/Layout'

// Each page is its own chunk so the first paint only downloads what it
// needs — recharts (My Progress) alone is ~⅓ of the old single bundle.
const Login = lazy(() => import('./pages/auth/Login'))
const Signup = lazy(() => import('./pages/auth/Signup'))
const AuthCallback = lazy(() => import('./pages/auth/AuthCallback'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const DailyHealthTracker = lazy(() => import('./pages/DailyHealthTracker'))
const DailyWorkoutTracker = lazy(() => import('./pages/DailyWorkoutTracker'))
const DailyDietTracker = lazy(() => import('./pages/DailyDietTracker'))
const MyProgress = lazy(() => import('./pages/MyProgress'))
const Profiles = lazy(() => import('./pages/Profiles'))
const ProfileView = lazy(() => import('./pages/ProfileView'))
const Settings = lazy(() => import('./pages/Settings'))

function PageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

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
        </Suspense>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  )
}
