import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useStreak } from '../hooks/useStreak'
import { useTodayHealthLog } from '../hooks/useHealthLogs'
import { useWorkoutPlan } from '../hooks/useWorkoutPlan'
import { useMealPlan } from '../hooks/useMealPlan'
import { Avatar } from '../components/ui/Avatar'
import { Card } from '../components/ui/Card'
import { StreakCounter } from '../components/dashboard/StreakCounter'
import { QuickStats } from '../components/dashboard/QuickStats'
import { todayStr, formatDate } from '../utils/dateUtils'
import { supabase } from '../lib/supabase'
import { useEffect, useState } from 'react'

const today = todayStr()

const quickActions = [
  { to: '/health',  emoji: '📋', label: "Log Today's Health",   color: 'from-blue-500 to-blue-600' },
  { to: '/workout', emoji: '💪', label: "Today's Workout",      color: 'from-brand-500 to-brand-600' },
  { to: '/diet',    emoji: '🥗', label: "Today's Diet",         color: 'from-orange-400 to-orange-500' },
]

export default function Dashboard() {
  const { profile } = useAuth()
  const { log: healthLog, loading: healthLoading } = useTodayHealthLog(profile?.user_id, today)
  const { plan: workoutPlan, log: workoutLog } = useWorkoutPlan(profile?.user_id, today)
  const { plan: mealPlan } = useMealPlan(profile?.user_id, today)
  const [members, setMembers] = useState([])

  // If coach, fetch linked members
  useEffect(() => {
    if (!profile?.is_coach || !profile?.user_id) return
    supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url')
      .eq('coach_id', profile.user_id)
      .then(({ data }) => setMembers(data || []))
  }, [profile?.is_coach, profile?.user_id])

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Avatar src={profile?.avatar_url} name={profile?.display_name} size="lg" />
        <div>
          <p className="text-sm text-gray-500">Hey there,</p>
          <h1 className="text-xl font-bold text-gray-900">{profile?.display_name} 👋</h1>
          <p className="text-xs text-gray-400 mt-0.5">{formatDate(today)}</p>
        </div>
      </div>

      {/* Streak */}
      <StreakCounter userId={profile?.user_id} />

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-3">
        {quickActions.map(({ to, emoji, label, color }) => (
          <Link key={to} to={to}>
            <div className={`bg-gradient-to-r ${color} text-white rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm active:scale-95 transition-transform`}>
              <span className="text-3xl">{emoji}</span>
              <span className="font-semibold text-base">{label}</span>
              <svg className="w-5 h-5 ml-auto opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick stats */}
      {!healthLoading && (
        <QuickStats healthLog={healthLog} workoutLog={workoutLog} workoutPlan={workoutPlan} />
      )}

      {/* Coach section — members overview */}
      {profile?.is_coach && members.length > 0 && (
        <Card className="p-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Your members</p>
          <div className="flex flex-col gap-2">
            {members.map(m => (
              <Link key={m.user_id} to={`/profiles/${m.user_id}`} className="flex items-center gap-3 hover:bg-gray-50 rounded-xl px-2 py-1.5 -mx-2 transition-colors">
                <Avatar src={m.avatar_url} name={m.display_name} size="sm" />
                <span className="text-sm font-medium text-gray-800">{m.display_name}</span>
                <svg className="w-4 h-4 ml-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Today's meal plan preview */}
      {mealPlan && (
        <Card className="p-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Today's meals</p>
          <Link to="/diet" className="text-sm text-brand-600 font-medium hover:underline">
            View meal plan →
          </Link>
        </Card>
      )}
    </div>
  )
}
