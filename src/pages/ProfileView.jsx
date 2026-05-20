import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useStreak } from '../hooks/useStreak'
import { Avatar } from '../components/ui/Avatar'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { WeightChart } from '../components/progress/WeightChart'
import { todayStr } from '../utils/dateUtils'

const today = todayStr()

export default function ProfileView() {
  const { userId } = useParams()
  const { profile: me } = useAuth()
  const [profile, setProfile] = useState(null)
  const [healthLog, setHealthLog] = useState(null)
  const [weightLogs, setWeightLogs] = useState([])
  const [workoutLog, setWorkoutLog] = useState(null)
  const [workoutPlan, setWorkoutPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const { streak } = useStreak(userId)

  const isMyProfile = userId === me?.user_id
  const isMyCoach = profile?.coach_id === me?.user_id
  const amTheirCoach = me?.is_coach && profile?.coach_id === me?.user_id

  useEffect(() => {
    if (!userId) return
    fetchAll()
  }, [userId])

  async function fetchAll() {
    setLoading(true)
    const [
      { data: profileData },
      { data: todayLog },
      { data: wLogs },
      { data: wPlan },
      { data: wLog },
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', userId).single(),
      supabase.from('health_logs')
        // Deliberately omit health_notes for privacy
        .select('id, date, weight_kg, sleep_hours, sleep_quality, supplements, activity_notes, photo_url')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle(),
      supabase.from('health_logs')
        .select('date, weight_kg')
        .eq('user_id', userId)
        .gte('date', new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10))
        .order('date'),
      supabase.from('workout_plans').select('*').eq('for_user_id', userId).eq('date', today).maybeSingle(),
      supabase.from('workout_logs').select('completed').eq('user_id', userId).eq('date', today).maybeSingle(),
    ])

    setProfile(profileData)
    setHealthLog(todayLog)
    setWeightLogs(wLogs || [])
    setWorkoutPlan(wPlan)
    setWorkoutLog(wLog)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-24 bg-white rounded-2xl border animate-pulse" />
        <div className="h-48 bg-white rounded-2xl border animate-pulse" />
      </div>
    )
  }

  if (!profile) return <p className="text-gray-500 text-center py-8">Profile not found.</p>

  const roles = []
  if (profile.is_coach) roles.push({ label: 'Coach', variant: 'blue' })
  if (profile.is_member) roles.push({ label: 'Member', variant: 'green' })

  const wsStatus = workoutPlan
    ? workoutLog?.completed ?? 'planned'
    : 'not planned'

  return (
    <div className="flex flex-col gap-5">
      {/* Back */}
      <Link to="/profiles" className="flex items-center gap-1.5 text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        All profiles
      </Link>

      {/* Profile header */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-brand-400 to-brand-600 h-20" />
        <div className="px-5 pb-5 -mt-10 flex items-end gap-4">
          <Avatar src={profile.avatar_url} name={profile.display_name} size="xl" className="ring-4 ring-white dark:ring-[#1C1C1E] shadow-sm flex-shrink-0" />
          <div className="pb-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">{profile.display_name}</h1>
              {isMyProfile && <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">you</span>}
            </div>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              {roles.map(r => <Badge key={r.label} variant={r.variant}>{r.label}</Badge>)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-5 pb-4 -mt-1">
          <span className="text-base">🔥</span>
          <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{streak} day streak</span>
        </div>
      </Card>

      {/* Today's snapshot */}
      <Card className="p-4">
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Today's Snapshot</p>
        <div className="grid grid-cols-3 gap-2.5">
          <MetricCard
            label="Weight"
            value={healthLog?.weight_kg ? healthLog.weight_kg : '—'}
            unit={healthLog?.weight_kg ? 'kg' : undefined}
            color="blue"
          />
          <MetricCard
            label="Sleep"
            value={healthLog?.sleep_hours ? healthLog.sleep_hours : '—'}
            unit={healthLog?.sleep_hours ? 'hrs' : undefined}
            color="purple"
          />
          <MetricCard
            label="Workout"
            value={wsStatus === 'yes' ? 'Done' : wsStatus === 'partial' ? 'Partial' : wsStatus === 'planned' ? 'Planned' : '—'}
            color={wsStatus === 'yes' ? 'green' : wsStatus === 'partial' ? 'yellow' : 'gray'}
          />
        </div>
        {healthLog?.activity_notes && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 italic">"{healthLog.activity_notes}"</p>
        )}
      </Card>

      {/* Weight trend */}
      <Card className="p-4">
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Weight (30 days)</p>
        <WeightChart logs={weightLogs} />
      </Card>

      {/* Coach actions */}
      {amTheirCoach && (
        <div className="flex flex-col gap-2.5">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1">Coach Actions</p>
          <Link to={`/health?for=${userId}`}>
            <div className="flex items-center gap-3 bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-white/10 rounded-2xl px-4 py-3.5 shadow-sm dark:shadow-none hover:bg-gray-50 dark:hover:bg-white/5 active:bg-gray-100 dark:active:bg-white/10 transition-colors">
              <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">Log Health</span>
              <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
          <div className="flex gap-2.5">
            <Link to={`/workout?for=${userId}`} className="flex-1">
              <div className="flex flex-col items-center gap-2 bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-white/10 rounded-2xl px-4 py-3.5 shadow-sm dark:shadow-none hover:bg-gray-50 dark:hover:bg-white/5 active:bg-gray-100 dark:active:bg-white/10 transition-colors">
                <div className="w-9 h-9 bg-brand-100 dark:bg-brand-900/30 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 text-center">Workout Plan</span>
              </div>
            </Link>
            <Link to={`/diet?for=${userId}`} className="flex-1">
              <div className="flex flex-col items-center gap-2 bg-white dark:bg-[#1C1C1E] border border-gray-100 dark:border-white/10 rounded-2xl px-4 py-3.5 shadow-sm dark:shadow-none hover:bg-gray-50 dark:hover:bg-white/5 active:bg-gray-100 dark:active:bg-white/10 transition-colors">
                <div className="w-9 h-9 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-orange-500 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 text-center">Meal Plan</span>
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({ label, value, unit, color }) {
  const styles = {
    blue:   'bg-blue-50   dark:bg-blue-900/20   text-blue-700   dark:text-blue-300',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300',
    green:  'bg-brand-50  dark:bg-brand-900/20  text-brand-700  dark:text-brand-300',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300',
    gray:   'bg-gray-100  dark:bg-white/5        text-gray-500   dark:text-gray-400',
  }
  return (
    <div className={`${styles[color]} rounded-2xl p-3 flex flex-col gap-0.5`}>
      <p className="text-xs font-medium opacity-60">{label}</p>
      <p className="text-base font-bold leading-tight">{value}</p>
      {unit && <p className="text-xs opacity-50">{unit}</p>}
    </div>
  )
}
