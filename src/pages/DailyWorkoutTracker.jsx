import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useWorkoutPlan } from '../hooks/useWorkoutPlan'
import { WorkoutPlanForm } from '../components/workout/WorkoutPlanForm'
import { WorkoutLogForm } from '../components/workout/WorkoutLogForm'
import { ExerciseRow } from '../components/workout/ExerciseRow'
import { YouTubeEmbed } from '../components/workout/YouTubeEmbed'
import { DateNavigator } from '../components/ui/DateNavigator'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { todayStr } from '../utils/dateUtils'

const SECTIONS = [
  { key: 'warmup',   label: 'Warm-up',     emoji: '🔥' },
  { key: 'main',     label: 'Main Workout', emoji: '💪' },
  { key: 'cooldown', label: 'Post-workout', emoji: '🧘' },
]

const completedConfig = {
  yes:     { label: 'Completed', variant: 'green' },
  partial: { label: 'Partial',   variant: 'yellow' },
  no:      { label: 'Missed',    variant: 'red' },
}

export default function DailyWorkoutTracker() {
  const { profile } = useAuth()
  const [searchParams] = useSearchParams()
  const forId = searchParams.get('for')
  const isCoachMode = !!forId && forId !== profile?.user_id
  const targetUserId = isCoachMode ? forId : profile?.user_id

  const [selectedDate, setSelectedDate] = useState(todayStr())
  const [memberName, setMemberName] = useState('')
  const [editingPlan, setEditingPlan] = useState(false)
  const [editingLog, setEditingLog] = useState(false)

  // Reset editing when date changes
  useEffect(() => { setEditingPlan(false); setEditingLog(false) }, [selectedDate])

  useEffect(() => {
    if (!isCoachMode) return
    supabase.from('profiles').select('display_name').eq('user_id', forId).single()
      .then(({ data }) => setMemberName(data?.display_name || 'Member'))
  }, [forId, isCoachMode])

  const { plan, exercises, log, loading, refetch } = useWorkoutPlan(targetUserId, selectedDate)

  const isFuture = selectedDate > todayStr()
  const canCreatePlan = !plan || editingPlan
  const showLog = plan && !editingLog && log
  const showLogForm = plan && (editingLog || !log)

  async function handlePlanSaved() { await refetch(); setEditingPlan(false) }
  async function handleLogSaved()  { await refetch(); setEditingLog(false) }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-12 bg-white rounded-2xl border border-gray-100 animate-pulse" />
        <div className="h-40 bg-white rounded-2xl border border-gray-100 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {isCoachMode && (
        <Link to={`/profiles/${forId}`} className="text-sm text-brand-600 hover:underline">
          ← Back to {memberName}'s profile
        </Link>
      )}
      <h1 className="text-xl font-bold text-gray-900">
        💪 {isCoachMode ? `${memberName}'s Workout` : "Today's Workout"}
      </h1>

      <DateNavigator date={selectedDate} onChange={setSelectedDate} />

      {/* Plan section */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="font-semibold text-gray-800">Workout plan</p>
          {plan && !editingPlan && (
            <button onClick={() => setEditingPlan(true)} className="text-sm text-brand-600 font-medium hover:underline">
              Edit
            </button>
          )}
        </div>

        {canCreatePlan ? (
          <WorkoutPlanForm
            createdBy={profile?.user_id}
            forUserId={targetUserId}
            date={selectedDate}
            existing={editingPlan ? plan : undefined}
            existingExercises={editingPlan ? exercises : undefined}
            onSaved={handlePlanSaved}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {plan.type === 'full_body' && (
              <>
                {plan.youtube_url && <YouTubeEmbed url={plan.youtube_url} title="Today's Workout" />}
                {plan.description && <p className="text-sm text-gray-700">{plan.description}</p>}
              </>
            )}

            {plan.type === 'individual' && SECTIONS.map(({ key, label, emoji }) => {
              const sectionExercises = exercises.filter(e => (e.section ?? 'main') === key)
              if (!sectionExercises.length) return null
              return (
                <div key={key} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500">{emoji} {label}</span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>
                  {sectionExercises.map(ex => (
                    <ExerciseRow
                      key={ex.id}
                      exercise={ex}
                      actual={log?.actual_exercises?.find(a => a.exercise_id === ex.id)}
                      readOnly
                    />
                  ))}
                </div>
              )
            })}

            {plan.cardio_type && (
              <div className="bg-blue-50 rounded-xl px-3 py-2 text-sm">
                <span className="font-medium text-blue-700">Cardio: </span>
                <span className="text-blue-600">
                  {plan.cardio_type}
                  {plan.cardio_duration_mins && ` · ${plan.cardio_duration_mins} mins`}
                  {plan.cardio_notes && ` · ${plan.cardio_notes}`}
                </span>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Log section — hidden for coach mode and future dates */}
      {plan && !isCoachMode && !isFuture && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-gray-800">Your log</p>
            {log && !editingLog && (
              <div className="flex items-center gap-2">
                <Badge variant={completedConfig[log.completed]?.variant}>
                  {completedConfig[log.completed]?.label}
                </Badge>
                <button onClick={() => setEditingLog(true)} className="text-sm text-brand-600 font-medium hover:underline">
                  Edit
                </button>
              </div>
            )}
          </div>

          {showLog && !editingLog ? (
            <div className="flex flex-col gap-2">
              {log.notes && <p className="text-sm text-gray-600 italic">"{log.notes}"</p>}
              {log.actual_exercises?.length > 0 && exercises.map(ex => (
                <ExerciseRow
                  key={ex.id}
                  exercise={ex}
                  actual={log.actual_exercises.find(a => a.exercise_id === ex.id)}
                  readOnly
                />
              ))}
            </div>
          ) : (
            <WorkoutLogForm
              plan={plan}
              exercises={exercises}
              existingLog={editingLog ? log : undefined}
              userId={profile?.user_id}
              onSaved={handleLogSaved}
            />
          )}
        </Card>
      )}
    </div>
  )
}
