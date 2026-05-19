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
  { to: '/health',  emoji: '📋', label: 'Health Log', sub: 'Weight · Sleep · Supplements', color: 'bg-blue-500' },
  { to: '/workout', emoji: '💪', label: 'Workout',    sub: 'Plan · Track · Log',            color: 'bg-brand-600' },
  { to: '/diet',    emoji: '🥗', label: 'Diet',       sub: 'Meals · Nutrition · Log',       color: 'bg-orange-500' },
]

export default function Dashboard() {
  const { profile } = useAuth()
  const { log: healthLog, loading: healthLoading } = useTodayHealthLog(profile?.user_id, today)
  const { plan: workoutPlan, log: workoutLog } = useWorkoutPlan(profile?.user_id, today)
  const { plan: mealPlan } = useMealPlan(profile?.user_id, today)
  const [members, setMembers] = useState([])

  useEffect(() => {
    if (!profile?.is_coach || !profile?.user_id) return
    supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url')
      .eq('coach_id', profile.user_id)
      .then(({ data }) => setMembers(data || []))
  }, [profile?.is_coach, profile?.user_id])

  return (
    <div className="flex flex-col gap-6">

      {/* Greeting */}
      <div className="flex items-center gap-3 pt-1">
        <Avatar src={profile?.avatar_url} name={profile?.display_name} size="lg" />
        <div className="flex-1 min-w-0">
          <p className="text-footnote text-gray-400 font-medium">{formatDate(today)}</p>
          <h1 className="text-title-2 text-gray-900 truncate">
            Hey, {profile?.display_name?.split(' ')[0]} 👋
          </h1>
        </div>
      </div>

      {/* Streak */}
      <StreakCounter userId={profile?.user_id} />

      {/* Quick stats */}
      {!healthLoading && (
        <QuickStats healthLog={healthLog} workoutLog={workoutLog} workoutPlan={workoutPlan} />
      )}

      {/* Quick actions */}
      <div className="flex flex-col gap-3">
        <p className="text-footnote font-semibold text-gray-400 uppercase tracking-wide px-0.5">Today</p>
        <div className="flex flex-col gap-2.5">
          {quickActions.map(({ to, emoji, label, sub, color }) => (
            <Link key={to} to={to}>
              <div className="bg-white rounded-apple-lg shadow-apple-card px-4 py-3.5 flex items-center gap-4 active:scale-[0.98] transition-transform">
                <div className={`${color} w-10 h-10 rounded-apple flex items-center justify-center flex-shrink-0`}>
                  <span className="text-xl">{emoji}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-headline text-gray-900 font-semibold">{label}</p>
                  <p className="text-footnote text-gray-400 mt-0.5">{sub}</p>
                </div>
                <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Today's meal plan preview */}
      {mealPlan && (
        <Card className="p-4">
          <p className="text-footnote font-semibold text-gray-400 uppercase tracking-wide mb-2">Today's meals</p>
          <Link to="/diet" className="text-callout text-brand-600 font-medium">
            View meal plan →
          </Link>
        </Card>
      )}

      {/* Coach section */}
      {profile?.is_coach && members.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-footnote font-semibold text-gray-400 uppercase tracking-wide px-0.5">Your members</p>
          <Card className="divide-y divide-[#F2F2F7] overflow-hidden">
            {members.map(m => (
              <Link
                key={m.user_id}
                to={`/profiles/${m.user_id}`}
                className="flex items-center gap-3 px-4 py-3 active:bg-[#F2F2F7] transition-colors"
              >
                <Avatar src={m.avatar_url} name={m.display_name} size="sm" />
                <span className="flex-1 text-callout font-medium text-gray-900">{m.display_name}</span>
                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </Card>
        </div>
      )}
    </div>
  )
}
