import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Button } from '../ui/Button'
import { Input, Textarea, Select } from '../ui/Input'

const SECTIONS = [
  { key: 'warmup',   label: 'Warm-up',      emoji: '🔥', hint: 'Stretching, light cardio, mobility' },
  { key: 'main',     label: 'Main Workout',  emoji: '💪', hint: 'Primary exercises' },
  { key: 'cooldown', label: 'Post-workout',  emoji: '🧘', hint: 'Cool-down, stretching, cardio finisher' },
]

const emptyExercise = (section) => ({
  _key: Math.random(),
  section,
  exercise_name: '',
  youtube_url: '',
  target_sets: '',
  target_reps: '',
  target_weight_kg: '',
})

function buildInitialExercises(existing) {
  if (!existing?.length) {
    return [emptyExercise('main')]
  }
  return existing.map(e => ({ ...e, _key: e.id }))
}

export function WorkoutPlanForm({ createdBy, forUserId, date, existing, existingExercises, onSaved }) {
  const [type, setType] = useState(existing?.type ?? 'individual')
  const [youtubeUrl, setYoutubeUrl] = useState(existing?.youtube_url ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [exercises, setExercises] = useState(buildInitialExercises(existingExercises))
  const [cardioType, setCardioType] = useState(existing?.cardio_type ?? '')
  const [cardioDuration, setCardioDuration] = useState(existing?.cardio_duration_mins ?? '')
  const [cardioNotes, setCardioNotes] = useState(existing?.cardio_notes ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function exercisesForSection(section) {
    return exercises.filter(e => e.section === section)
  }

  function updateExercise(key, field, value) {
    setExercises(ex => ex.map(e => e._key === key ? { ...e, [field]: value } : e))
  }

  function addExercise(section) {
    setExercises(ex => [...ex, emptyExercise(section)])
  }

  function removeExercise(key) {
    setExercises(ex => ex.filter(e => e._key !== key))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const planPayload = {
      created_by: createdBy,
      for_user_id: forUserId,
      date,
      type,
      youtube_url: youtubeUrl || null,
      description: description || null,
      cardio_type: cardioType || null,
      cardio_duration_mins: cardioDuration ? parseInt(cardioDuration) : null,
      cardio_notes: cardioNotes || null,
    }

    let planId
    if (existing) {
      const { error: err } = await supabase.from('workout_plans').update(planPayload).eq('id', existing.id)
      if (err) { setError(err.message); setLoading(false); return }
      planId = existing.id
      await supabase.from('workout_exercises').delete().eq('plan_id', planId)
    } else {
      const { data, error: err } = await supabase.from('workout_plans').insert(planPayload).select().single()
      if (err) { setError(err.message); setLoading(false); return }
      planId = data.id
    }

    if (type === 'individual') {
      const filled = exercises.filter(e => e.exercise_name.trim())
      if (filled.length) {
        // Order within each section
        const sectionOrder = { warmup: 0, main: 1, cooldown: 2 }
        const counters = { warmup: 0, main: 0, cooldown: 0 }
        const exPayload = filled.map(e => {
          const idx = counters[e.section]++
          return {
            plan_id: planId,
            section: e.section,
            exercise_name: e.exercise_name.trim(),
            youtube_url: e.youtube_url || null,
            target_sets: e.target_sets ? parseInt(e.target_sets) : null,
            target_reps: e.target_reps ? parseInt(e.target_reps) : null,
            target_weight_kg: e.target_weight_kg ? parseFloat(e.target_weight_kg) : null,
            order_index: sectionOrder[e.section] * 100 + idx,
          }
        })
        await supabase.from('workout_exercises').insert(exPayload)
      }
    }

    onSaved?.()
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Select label="Workout type" value={type} onChange={e => setType(e.target.value)}>
        <option value="individual">Individual exercises</option>
        <option value="full_body">Full body (one video)</option>
      </Select>

      {type === 'full_body' ? (
        <>
          <Input label="YouTube link" type="url" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
          <Textarea label="Description" value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Workout description..." />
        </>
      ) : (
        <div className="flex flex-col gap-5">
          {SECTIONS.map(({ key, label, emoji, hint }) => {
            const sectionExercises = exercisesForSection(key)
            return (
              <div key={key} className="flex flex-col gap-3">
                {/* Section header */}
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-gray-700">{emoji} {label}</span>
                  <span className="text-xs text-gray-400">— {hint}</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>

                {sectionExercises.map((ex, idx) => (
                  <div key={ex._key} className="border border-gray-100 rounded-2xl p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-gray-400">Exercise {idx + 1}</p>
                      {sectionExercises.length > (key === 'main' ? 1 : 0) && (
                        <button type="button" onClick={() => removeExercise(ex._key)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                      )}
                    </div>
                    <Input placeholder="Exercise name" value={ex.exercise_name} onChange={e => updateExercise(ex._key, 'exercise_name', e.target.value)} />
                    <Input placeholder="YouTube reference URL (optional)" type="url" value={ex.youtube_url} onChange={e => updateExercise(ex._key, 'youtube_url', e.target.value)} />
                    <div className="grid grid-cols-3 gap-2">
                      <Input placeholder="Sets" type="number" value={ex.target_sets} onChange={e => updateExercise(ex._key, 'target_sets', e.target.value)} />
                      <Input placeholder="Reps" type="number" value={ex.target_reps} onChange={e => updateExercise(ex._key, 'target_reps', e.target.value)} />
                      <Input placeholder="Weight kg" type="number" step="0.5" value={ex.target_weight_kg} onChange={e => updateExercise(ex._key, 'target_weight_kg', e.target.value)} />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addExercise(key)}
                  className="text-sm text-brand-600 font-medium hover:underline text-left"
                >
                  + Add {label.toLowerCase()} exercise
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Cardio slot */}
      <div className="border-t border-gray-100 pt-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-gray-700">🚴 Cardio (optional)</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Type (e.g. incline walk)" value={cardioType} onChange={e => setCardioType(e.target.value)} />
          <Input placeholder="Duration (mins)" type="number" value={cardioDuration} onChange={e => setCardioDuration(e.target.value)} />
        </div>
        <Input placeholder="Intensity / notes" value={cardioNotes} onChange={e => setCardioNotes(e.target.value)} />
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <Button type="submit" loading={loading} size="lg" className="w-full">
        {existing ? 'Update plan' : 'Save plan'}
      </Button>
    </form>
  )
}
