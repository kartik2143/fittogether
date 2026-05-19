import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Button } from '../ui/Button'
import { Textarea } from '../ui/Input'
import { MealSlot } from './MealSlot'

const MEALS = [
  { key: 'breakfast', label: 'Breakfast', emoji: '🍳' },
  { key: 'lunch',     label: 'Lunch',     emoji: '🥗', alwaysEditable: true },
  { key: 'dinner',    label: 'Dinner',    emoji: '🍽️' },
  { key: 'snacks',    label: 'Snacks',    emoji: '🍎' },
]

export function MealLogForm({ plan, existingLog, userId, onSaved }) {
  const [actuals, setActuals] = useState({
    actual_breakfast: existingLog?.actual_breakfast ?? '',
    actual_lunch: existingLog?.actual_lunch ?? '',
    actual_dinner: existingLog?.actual_dinner ?? '',
    actual_snacks: existingLog?.actual_snacks ?? '',
  })
  const [notes, setNotes] = useState(existingLog?.notes ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function setActual(key, value) {
    setActuals(a => ({ ...a, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const payload = {
      plan_id: plan?.id ?? null,
      user_id: userId,
      date: plan?.date ?? new Date().toISOString().slice(0, 10),
      ...Object.fromEntries(Object.entries(actuals).map(([k, v]) => [k, v || null])),
      notes: notes || null,
    }

    let err
    if (existingLog) {
      ;({ error: err } = await supabase.from('meal_logs').update(payload).eq('id', existingLog.id))
    } else {
      ;({ error: err } = await supabase.from('meal_logs').insert(payload))
    }

    if (err) setError(err.message)
    else onSaved?.()
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {MEALS.map(({ key, label, emoji, alwaysEditable }) => (
        <MealSlot
          key={key}
          emoji={emoji}
          label={label}
          planned={plan?.[key]}
          plannedNotes={plan?.[`${key}_notes`]}
          actual={actuals[`actual_${key}`]}
          onChange={val => setActual(`actual_${key}`, val)}
          alwaysEditable={alwaysEditable}
        />
      ))}

      <Textarea
        label="Day notes (optional)"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Any notes about today's eating…"
        rows={2}
      />

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <Button type="submit" loading={loading} size="lg" className="w-full">
        {existingLog ? 'Update log' : 'Save log'}
      </Button>
    </form>
  )
}
