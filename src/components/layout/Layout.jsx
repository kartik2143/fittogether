import { useState, useEffect } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { SideDrawer } from './SideDrawer'
import { ChatWidget } from '../chat/ChatWidget'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

const bottomNav = [
  { to: '/',        label: 'Home',    icon: HomeIcon,    end: true },
  { to: '/health',  label: 'Health',  icon: HealthIcon  },
  { to: '/workout', label: 'Workout', icon: WorkoutIcon },
  { to: '/diet',    label: 'Diet',    icon: DietIcon    },
  { to: '/progress',label: 'Progress',icon: ProgressIcon},
]

export function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { profile } = useAuth()
  const [pendingCount, setPendingCount] = useState(0)

  // Lightweight badge check — just a count, not full request objects
  useEffect(() => {
    if (!profile?.user_id || !profile?.is_coach) return
    supabase
      .from('coach_requests')
      .select('id', { count: 'exact', head: true })
      .eq('coach_id', profile.user_id)
      .eq('status', 'pending')
      .then(({ count }) => setPendingCount(count || 0))
  }, [profile?.user_id, profile?.is_coach])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="FitTogether" className="w-7 h-7" />
          <span className="font-bold text-gray-900 text-base">FitTogether</span>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Open menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          {pendingCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
          )}
        </button>
      </header>

      <SideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-5 pb-24">
        <Outlet />
      </main>

      <ChatWidget />

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-100 safe-bottom">
        <div className="max-w-lg mx-auto flex items-center">
          {bottomNav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors
                ${isActive ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'}`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon active={isActive} />
                  <span className="text-[10px] font-medium">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

function HomeIcon({ active }) {
  return (
    <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}
function HealthIcon({ active }) {
  return (
    <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  )
}
function WorkoutIcon({ active }) {
  return (
    <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
}
function DietIcon({ active }) {
  return (
    <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  )
}
function ProgressIcon({ active }) {
  return (
    <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}
