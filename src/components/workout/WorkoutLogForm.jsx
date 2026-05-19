import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Button } from '../ui/Button'
import { Textarea, Select } from '../ui/Input'
import { ExerciseRow } from './ExerciseRow'

const SECTIONS = [
  { key: 'warmup',   label: 'Warm-up',     emoji: '🔥' },
  { key: 'main',     label: 'Main Workout', emoji: '💪' },
  { key: 'cooldown', label: 'Post-workout', emoji: '🧘' },
]

export function WorkoutLogForm({ plan, exercises, existingLog, userId, onSaved }) {
  const [completed, setCompleted] = useState(existingLog?.completed ?? 'yes')
  const [notes, setNotes] = useState(existingLog?.notes ?? '')
  const [actuals, setActuals] = useState(
    existingLog?.actual_exercises ?? exercises.map(e => ({ exercise_id: e.id }))
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function updateActual(exerciseId, data) {
    setActuals(prev => {
      const exists = prev.find(a => a.exercise_id === exerciseId)
      if (exists) return prev.map(a => a.exercise_id === exerciseId ? data : a)
      return [...prev, data]
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const payload = {
      plan_id: plan.id,
      user_id: userId,
      date: plan.date,
      completed,
      notes: notes || null,
      actual_exercises: actuals,
    }

    let err
    if (existingLog) {
      ;({ error: err } = await supabase.from('workout_logs').update(payload).eq('id', existingLog.id))
    } else {
      ;({ error: err } = await supabase.from('workout_logs').insert(payload))
    }

    if (err) setError(err.message)
    else onSaved?.()
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Select
        label="Did you complete this workout?"
        value={completed}
        onChange={e => setCompleted(e.target.value)}
      >
        <option value="yes">Yes — fully completed</option>
        <option value="partial">Partial — did some of it</option>
        <option value="no">No — skipped</option>
      </Select>

      {exercises.length > 0 && completed !== 'no' && (
        <div className="flex flex-col gap-4">
          <p className="text-sm font-medium text-gray-700">Log your actual performance</p>
          {SECTIONS.map(({ key, label, emoji }) => {
            const sectionExercises = exercises.filter(e => (e.section ?? 'main') === key)
            if (!sectionExercises.length) return null
            return (
              <div key={key} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500">{emoji} {label}</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
                {sectionExercises.map(ex => {
                  const actual = actuals.find(a => a.exercise_id === ex.id) ?? {}
                  return (
                    <ExerciseRow
                      key={ex.id}
                      exercise={ex}
                      actual={actual}
                      onChange={data => updateActual(ex.id, data)}
                      readOnly={false}
                    />
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

      <Textarea
        label="Notes"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="e.g. Skipped last set, felt exhausted"
        rows={2}
      />

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <Button type="submit" loading={loading} size="lg" className="w-full">
        {existingLog ? 'Update log' : 'Save log'}
      </Button>
    </form>
  )
}
