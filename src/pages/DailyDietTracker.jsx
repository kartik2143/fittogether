import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useMealPlan } from '../hooks/useMealPlan'
import { MealPlanForm } from '../components/diet/MealPlanForm'
import { MealLogForm } from '../components/diet/MealLogForm'
import { MealSlot } from '../components/diet/MealSlot'
import { DateNavigator } from '../components/ui/DateNavigator'
import { Card } from '../components/ui/Card'
import { todayStr } from '../utils/dateUtils'

const MEALS = [
  { key: 'breakfast', label: 'Breakfast', emoji: '🍳' },
  { key: 'lunch',     label: 'Lunch',     emoji: '🥗' },
  { key: 'dinner',    label: 'Dinner',    emoji: '🍽️' },
  { key: 'snacks',    label: 'Snacks',    emoji: '🍎' },
]

export default function DailyDietTracker() {
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

  const { plan, log, loading, refetch } = useMealPlan(targetUserId, selectedDate)

  const isFuture = selectedDate > todayStr()

  async function handlePlanSaved() { await refetch(); setEditingPlan(false) }
  async function handleLogSaved()  { await refetch(); setEditingLog(false) }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-12 bg-white rounded-2xl border border-gray-100 animate-pulse" />
        {[1,2,3,4].map(i => <div key={i} className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}
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
        🥗 {isCoachMode ? `${memberName}'s Diet` : "Today's Diet"}
      </h1>

      <DateNavigator date={selectedDate} onChange={setSelectedDate} />

      {/* Plan section */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="font-semibold text-gray-800">Meal plan</p>
          {plan && !editingPlan && (
            <button onClick={() => setEditingPlan(true)} className="text-sm text-brand-600 font-medium hover:underline">
              Edit
            </button>
          )}
        </div>

        {!plan || editingPlan ? (
          <MealPlanForm
            createdBy={profile?.user_id}
            forUserId={targetUserId}
            date={selectedDate}
            existing={editingPlan ? plan : undefined}
            onSaved={handlePlanSaved}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {MEALS.map(({ key, label, emoji }) => (
              plan[key] && (
                <MealSlot
                  key={key}
                  emoji={emoji}
                  label={label}
                  planned={plan[key]}
                  plannedNotes={plan[`${key}_notes`]}
                  readOnly
                />
              )
            ))}
          </div>
        )}
      </Card>

      {/* Log section — hidden for coach mode and future dates */}
      {!isCoachMode && !isFuture && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-gray-800">Your log</p>
            {log && !editingLog && (
              <button onClick={() => setEditingLog(true)} className="text-sm text-brand-600 font-medium hover:underline">
                Edit
              </button>
            )}
          </div>

          {log && !editingLog ? (
            <div className="flex flex-col gap-3">
              {MEALS.map(({ key, label, emoji }) => (
                <MealSlot
                  key={key}
                  emoji={emoji}
                  label={label}
                  planned={plan?.[key]}
                  plannedNotes={plan?.[`${key}_notes`]}
                  actual={log[`actual_${key}`]}
                  readOnly
                />
              ))}
              {log.notes && (
                <p className="text-sm text-gray-500 italic mt-1">Notes: {log.notes}</p>
              )}
            </div>
          ) : (
            <MealLogForm
              plan={plan}
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
