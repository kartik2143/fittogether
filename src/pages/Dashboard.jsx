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

const quickActions = [
  { to: '/health',  emoji: '📋', label: "Log today's health", desc: 'Weight, sleep, supplements', tint: 'bg-brand-50 text-brand-700' },
  { to: '/workout', emoji: '💪', label: "Today's workout",     desc: 'Plan and log your session',  tint: 'bg-sage-100 text-sage-700' },
  { to: '/diet',    emoji: '🥗', label: "Today's diet",        desc: 'Meals and nutrition',        tint: 'bg-amber-100 text-amber-800' },
]

export default function Dashboard() {
  const today = todayStr()
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
      <div className="relative overflow-hidden rounded-3xl bg-white border border-gray-200/70 shadow-card px-5 py-5 bg-warm-wash">
        <div className="flex items-center gap-3.5">
          <Avatar src={profile?.avatar_url} name={profile?.display_name} size="lg" />
          <div className="min-w-0">
            <p className="text-[13px] text-gray-500 font-medium">{formatDate(today)}</p>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight truncate">
              Hi, {profile?.display_name?.split(' ')[0] || 'there'}
            </h1>
          </div>
        </div>
      </div>

      {/* Streak */}
      <StreakCounter userId={profile?.user_id} />

      {/* Quick actions */}
      <div className="flex flex-col gap-2.5">
        {quickActions.map(({ to, emoji, label, desc, tint }) => (
          <Link key={to} to={to} className="group">
            <div className="bg-white border border-gray-200/70 shadow-card rounded-2xl px-4 py-3.5 flex items-center gap-3.5 active:scale-[0.99] transition-transform">
              <span className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl ${tint}`}>{emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-gray-900 text-[15px] leading-tight">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </div>
              <svg className="w-5 h-5 text-gray-300 group-hover:text-gray-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
