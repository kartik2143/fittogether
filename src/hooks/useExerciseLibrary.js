import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const norm = (s) => (s || '').trim().toLowerCase()

// A personal exercise library for a given user, sourced two ways:
//  • favorites  — curated, from the favorite_exercises table
//  • history    — auto-derived from past plans, deduped by name (newest first)
// Both key off the same userId (for coaches, that's the member the plan is for).
export function useExerciseLibrary(userId) {
  const [favorites, setFavorites] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    if (!userId) return
    setLoading(true)

    const [favRes, planRes] = await Promise.all([
      supabase
        .from('favorite_exercises')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true }),
      supabase
        .from('workout_plans')
        .select('date, workout_exercises(exercise_name, youtube_url, target_sets, target_reps, target_weight_kg)')
        .eq('for_user_id', userId)
        .order('date', { ascending: false })
        .limit(60),
    ])

    // Resilient if the table doesn't exist yet — favourites just stay empty.
    setFavorites(favRes.error ? [] : (favRes.data || []))

    // Flatten exercises newest-first, keep the first (most recent) of each name.
    const seen = new Set()
    const hist = []
    for (const plan of planRes.data || []) {
      for (const ex of plan.workout_exercises || []) {
        const key = norm(ex.exercise_name)
        if (!key || seen.has(key)) continue
        seen.add(key)
        hist.push(ex)
      }
    }
    setHistory(hist)
    setLoading(false)
  }, [userId])

  useEffect(() => { fetchAll() }, [fetchAll])

  const favSet = new Set(favorites.map(f => norm(f.exercise_name)))
  const isFavorite = (name) => favSet.has(norm(name))

  async function toggleFavorite(ex) {
    const name = ex?.exercise_name?.trim()
    if (!userId || !name) return

    if (favSet.has(norm(name))) {
      await supabase
        .from('favorite_exercises')
        .delete()
        .eq('user_id', userId)
        .eq('exercise_name', name)
    } else {
      await supabase.from('favorite_exercises').insert({
        user_id: userId,
        exercise_name: name,
        youtube_url: ex.youtube_url || null,
        target_sets: ex.target_sets ? parseInt(ex.target_sets) : null,
        target_reps: ex.target_reps ? parseInt(ex.target_reps) : null,
        target_weight_kg: ex.target_weight_kg ? parseFloat(ex.target_weight_kg) : null,
      })
    }
    fetchAll()
  }

  return { favorites, history, loading, isFavorite, toggleFavorite, refetch: fetchAll }
}
