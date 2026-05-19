import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useHealthLogs } from '../hooks/useHealthLogs'
import { WeightChart } from '../components/progress/WeightChart'
import { SleepChart } from '../components/progress/SleepChart'
import { PhotoTimeline } from '../components/progress/PhotoTimeline'
import { Card } from '../components/ui/Card'
import { useStreak } from '../hooks/useStreak'
import { supabase } from '../lib/supabase'
import { todayStr, subtractDays } from '../utils/dateUtils'

const today = todayStr()

export default function MyProgress() {
  const { profile } = useAuth()
  const [weightRange, setWeightRange] = useState('30d')
  const { logs: allLogs, loading } = useHealthLogs(profile?.user_id, 999)
  const { streak } = useStreak(profile?.user_id)
  const [workoutStats, setWorkoutStats] = useState(null)

  useEffect(() => {
    if (!profile?.user_id) return
    fetchWorkoutStats()
  }, [profile?.user_id])

  async function fetchWorkoutStats() {
    const since = subtractDays(today, 30)
    const [{ data: plans }, { data: logs }] = await Promise.all([
      supabase.from('workout_plans').select('id, date').eq('for_user_id', profile.user_id).gte('date', since),
      supabase.from('workout_logs').select('completed, date').eq('user_id', profile.user_id).gte('date', since),
    ])
    if (!plans) return
    const completed = (logs ?? []).filter(l => l.completed === 'yes' || l.completed === 'partial').length
    setWorkoutStats({ total: plans.length, completed })
  }

  const displayLogs = weightRange === '30d'
    ? allLogs.filter(l => l.date >= subtractDays(today, 30))
    : allLogs

  // Supplement adherence over last 30 days
  const last30 = allLogs.filter(l => l.date >= subtractDays(today, 30))
  const suppMap = {}
  last30.forEach(l => {
    (l.supplements || []).forEach(s => {
      suppMap[s] = (suppMap[s] || 0) + 1
    })
  })
  const suppStats = Object.entries(suppMap)
    .map(([name, count]) => ({ name, pct: Math.round((count / last30.length) * 100) }))
    .sort((a, b) => b.pct - a.pct)

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-8 w-40 bg-gray-200 rounded animate-pulse" />
        {[1,2,3].map(i => <div key={i} className="h-48 bg-white rounded-2xl border animate-pulse" />)}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold text-gray-900">📈 My Progress</h1>

      {/* Weight chart */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="font-semibold text-gray-800">Weight</p>
          <div className="flex gap-1">
            {[['30d', 'Last 30 days'], ['all', 'All time']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setWeightRange(val)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors
                  ${weightRange === val ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <WeightChart logs={displayLogs} />
      </Card>

      {/* Sleep chart */}
      <Card className="p-4">
        <p className="font-semibold text-gray-800 mb-3">Sleep (last 14 days)</p>
        <SleepChart logs={last30} />
        <div className="flex gap-3 mt-2 flex-wrap">
          {[
            ['#ef4444', 'Poor (1)'], ['#f97316', '(2)'], ['#eab308', 'OK (3)'],
            ['#84cc16', 'Good (4)'], ['#22c55e', 'Great (5)'],
          ].map(([color, label]) => (
            <div key={label} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
              <span className="text-xs text-gray-400">{label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Workout stats */}
      <Card className="p-4">
        <p className="font-semibold text-gray-800 mb-3">Workouts (last 30 days)</p>
        <div className="grid grid-cols-2 gap-3">
          <StatTile label="Streak" value={`${streak} days`} emoji="🔥" />
          <StatTile
            label="Completion rate"
            value={workoutStats?.total ? `${Math.round((workoutStats.completed / workoutStats.total) * 100)}%` : '—'}
            emoji="✅"
          />
        </div>
      </Card>

      {/* Supplement adherence */}
      {suppStats.length > 0 && (
        <Card className="p-4">
          <p className="font-semibold text-gray-800 mb-3">Supplement adherence (last 30 days)</p>
          <div className="flex flex-col gap-2">
            {suppStats.map(({ name, pct }) => (
              <div key={name} className="flex items-center gap-3">
                <p className="text-sm text-gray-700 w-32 truncate">{name}</p>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className="bg-brand-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-sm font-medium text-gray-600 w-10 text-right">{pct}%</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Progress photos */}
      <Card className="p-4">
        <p className="font-semibold text-gray-800 mb-3">Progress photos</p>
        <PhotoTimeline logs={[...allLogs].sort((a, b) => a.date.localeCompare(b.date))} />
      </Card>
    </div>
  )
}

function StatTile({ label, value, emoji }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 flex flex-col gap-1">
      <p className="text-lg">{emoji}</p>
      <p className="text-base font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  )
}
