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
      <Link to="/profiles" className="text-sm text-brand-600 hover:underline">← All profiles</Link>

      {/* Profile header */}
      <Card className="p-5 flex items-center gap-4">
        <Avatar src={profile.avatar_url} name={profile.display_name} size="xl" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold text-gray-900">{profile.display_name}</h1>
            {isMyProfile && <span className="text-xs text-gray-400">(you)</span>}
          </div>
          <div className="flex gap-1 mt-1 flex-wrap">
            {roles.map(r => <Badge key={r.label} variant={r.variant}>{r.label}</Badge>)}
          </div>
          <div className="flex items-center gap-1 mt-2">
            <span className="text-base">🔥</span>
            <span className="text-sm font-bold text-orange-600">{streak} day streak</span>
          </div>
        </div>
      </Card>

      {/* Today's snapshot */}
      <Card className="p-4">
        <p className="font-semibold text-gray-800 mb-3">Today's snapshot</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat label="Weight" value={healthLog?.weight_kg ? `${healthLog.weight_kg} kg` : '—'} />
          <Stat label="Sleep" value={healthLog?.sleep_hours ? `${healthLog.sleep_hours}h` : '—'} />
          <Stat label="Workout" value={wsStatus === 'yes' ? '✅ Done' : wsStatus === 'partial' ? '🟡 Partial' : wsStatus === 'planned' ? '📋 Planned' : '—'} />
        </div>
        {healthLog?.activity_notes && (
          <p className="text-sm text-gray-500 mt-3 italic">"{healthLog.activity_notes}"</p>
        )}
      </Card>

      {/* Weight trend */}
      <Card className="p-4">
        <p className="font-semibold text-gray-800 mb-3">Weight trend (30 days)</p>
        <WeightChart logs={weightLogs} />
      </Card>

      {/* Coach actions */}
      {amTheirCoach && (
        <div className="flex gap-2">
          <Link to={`/workout?for=${userId}`} className="flex-1">
            <button className="w-full py-2.5 rounded-xl border border-brand-300 text-brand-700 text-sm font-medium hover:bg-brand-50 transition-colors">
              Write workout plan
            </button>
          </Link>
          <Link to={`/diet?for=${userId}`} className="flex-1">
            <button className="w-full py-2.5 rounded-xl border border-brand-300 text-brand-700 text-sm font-medium hover:bg-brand-50 transition-colors">
              Write meal plan
            </button>
          </Link>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5 py-2">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-semibold text-gray-800">{value}</p>
    </div>
  )
}
