import { useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Avatar } from '../ui/Avatar'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const navItems = [
  { to: '/',        label: 'Dashboard',             icon: '🏠' },
  { to: '/health',  label: 'Daily Health Tracker',  icon: '📋' },
  { to: '/workout', label: 'Daily Workout Tracker', icon: '💪' },
  { to: '/diet',    label: 'Daily Diet Tracker',    icon: '🥗' },
  { to: '/progress',label: 'My Progress',           icon: '📈' },
  { to: '/profiles',label: 'Profiles',              icon: '👥' },
  { to: '/settings',label: 'Settings',              icon: '⚙️' },
]

export function SideDrawer({ open, onClose }) {
  const { profile } = useAuth()
  const location = useLocation()

  // Close on navigation
  useEffect(() => { onClose() }, [location.pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40"
          onClick={onClose}
        />
      )}

      {/* Drawer panel */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-full w-72 bg-white dark:bg-[#1C1C1E] shadow-xl dark:shadow-2xl
          transform transition-transform duration-300 ease-in-out
          flex flex-col
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Profile header */}
        <div className="flex items-center gap-3 p-5 border-b border-gray-100 dark:border-white/10">
          <Avatar src={profile?.avatar_url} name={profile?.display_name} size="md" />
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white truncate">{profile?.display_name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{profile?.email}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 border-r-2 border-brand-600'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                }`
              }
            >
              <span className="text-base">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Sign out */}
        <div className="p-4 border-t border-gray-100 dark:border-white/10">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}
