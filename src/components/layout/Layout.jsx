import { useState, useEffect } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { SideDrawer } from './SideDrawer'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

const bottomNav = [
  { to: '/',         label: 'Home',    icon: HomeIcon,     end: true },
  { to: '/health',   label: 'Health',  icon: HealthIcon  },
  { to: '/workout',  label: 'Workout', icon: WorkoutIcon },
  { to: '/diet',     label: 'Diet',    icon: DietIcon    },
  { to: '/progress', label: 'Progress',icon: ProgressIcon},
]

export function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { profile } = useAuth()
  const [pendingCount, setPendingCount] = useState(0)

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
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F2F2F7' }}>

      {/* Top bar — frosted glass */}
      <header className="sticky top-0 z-20 glass shadow-apple-bar px-4 h-12 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="FitTogether" className="w-6 h-6" />
          <span className="text-headline font-semibold text-gray-900 tracking-tight">FitTogether</span>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="relative p-2 -mr-1 rounded-apple text-gray-500 active:bg-black/5 transition-colors"
          aria-label="Open menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          {pendingCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
          )}
        </button>
      </header>

      <SideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-5 pb-28">
        <Outlet />
      </main>

      {/* Bottom tab bar — frosted glass, Apple tab bar style */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 glass shadow-apple-nav safe-bottom">
        <div className="max-w-lg mx-auto flex items-center h-12">
          {bottomNav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-0.5 h-full transition-colors
                 ${isActive ? 'text-brand-600' : 'text-gray-400'}`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon active={isActive} />
                  <span className="text-[10px] font-medium tracking-tight">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

// SF Symbol-inspired icons — filled when active, thin stroke when inactive
function HomeIcon({ active }) {
  return active ? (
    <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a2 2 0 002 2h3a1 1 0 001-1v-3h2v3a1 1 0 001 1h3a2 2 0 002-2v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
    </svg>
  ) : (
    <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}

function HealthIcon({ active }) {
  return active ? (
    <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2h-3.382l-.724-1.447A1 1 0 0015 2H9zM7 8a1 1 0 012 0v2h2a1 1 0 110 2H9v2a1 1 0 11-2 0v-2H5a1 1 0 110-2h2V8zm9 2a1 1 0 100-2 1 1 0 000 2zm-2 2a1 1 0 112 0 1 1 0 01-2 0z" clipRule="evenodd" />
    </svg>
  ) : (
    <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  )
}

function WorkoutIcon({ active }) {
  return active ? (
    <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M11.757 2.034a1 1 0 01.976.738l1.4 4.914 1.655-1.653a1 1 0 011.414 1.414l-2.86 2.86-.028.029a1 1 0 01-1.574-.23L11.1 7.196l-2.36 8.259 1.901-1.901a1 1 0 011.36-.06l3 2.5a1 1 0 01-1.28 1.536l-2.394-1.994-2.756 2.756a1 1 0 01-1.62-1.138l3.96-13.86a1 1 0 01.846-.26z" clipRule="evenodd" />
    </svg>
  ) : (
    <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
}

function DietIcon({ active }) {
  return active ? (
    <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zm4-7v3M12 1v3M8 1v3" />
    </svg>
  ) : (
    <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zm4-7v3M12 1v3M8 1v3" />
    </svg>
  )
}

function ProgressIcon({ active }) {
  return active ? (
    <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 17H5a2 2 0 000 4h4a2 2 0 000-4zm6-8h-4a2 2 0 000 4h4a2 2 0 000-4zm6-6h-4a2 2 0 000 4h4a2 2 0 000-4z" />
      <path d="M9 19H5v-2h4v2zm6-8h-4v-2h4v2zm6-6h-4V3h4v2z" />
    </svg>
  ) : (
    <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}
