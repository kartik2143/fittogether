import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Button } from '../ui/Button'
import { Input, Textarea } from '../ui/Input'

const MEALS = [
  { key: 'breakfast', label: 'Breakfast', emoji: '🍳' },
  { key: 'lunch',     label: 'Lunch',     emoji: '🥗' },
  { key: 'dinner',    label: 'Dinner',    emoji: '🍽️' },
  { key: 'snacks',    label: 'Snacks',    emoji: '🍎' },
]

export function MealPlanForm({ createdBy, forUserId, date, existing, onSaved }) {
  const [meals, setMeals] = useState({
    breakfast: existing?.breakfast ?? '',
    breakfast_notes: existing?.breakfast_notes ?? '',
    lunch: existing?.lunch ?? '',
    lunch_notes: existing?.lunch_notes ?? '',
    dinner: existing?.dinner ?? '',
    dinner_notes: existing?.dinner_notes ?? '',
    snacks: existing?.snacks ?? '',
    snacks_notes: existing?.snacks_notes ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function setMeal(key, value) {
    setMeals(m => ({ ...m, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const payload = {
      created_by: createdBy,
      for_user_id: forUserId,
      date,
      ...Object.fromEntries(Object.entries(meals).map(([k, v]) => [k, v || null])),
    }

    let err
    if (existing) {
      ;({ error: err } = await supabase.from('meal_plans').update(payload).eq('id', existing.id))
    } else {
      ;({ error: err } = await supabase.from('meal_plans').insert(payload))
    }

    if (err) setError(err.message)
    else onSaved?.()
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {MEALS.map(({ key, label, emoji }) => (
        <div key={key} className="border border-gray-100 rounded-2xl p-3 flex flex-col gap-2">
          <p className="font-medium text-sm text-gray-800">{emoji} {label}</p>
          <Textarea
            placeholder={`${label} plan…`}
            value={meals[key]}
            onChange={e => setMeal(key, e.target.value)}
            rows={2}
          />
          <Input
            placeholder="Notes (optional)"
            value={meals[`${key}_notes`]}
            onChange={e => setMeal(`${key}_notes`, e.target.value)}
          />
        </div>
      ))}

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <Button type="submit" loading={loading} size="lg" className="w-full">
        {existing ? 'Update meal plan' : 'Save meal plan'}
      </Button>
    </form>
  )
}
