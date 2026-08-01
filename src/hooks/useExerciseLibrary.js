import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const norm = (s) => (s || '').trim().toLowerCase()

// Blank string / undefined must become null, not 0 or NaN.
const toInt = (v) => (v === '' || v == null ? null : parseInt(v))
const toNum = (v) => (v === '' || v == null ? null : parseFloat(v))

// A personal exercise library for a given user, sourced two ways:
//  • favorites  — the curated, editable catalogue (favorite_exercises table)
//  • history    — auto-derived from past plans, deduped by name (newest first)
// Both key off the same userId (for coaches, that's the member the plan is for).
//
// History has no rows of its own, so "deleting" an entry suppresses the name
// via hidden_exercises instead of touching past workouts. `history` excludes
// hidden entries (what the picker shows); `allHistory` keeps them so the
// manager can list and un-hide them.
export function useExerciseLibrary(userId) {
  const [favorites, setFavorites] = useState([])
  const [allHistory, setAllHistory] = useState([])
  const [hidden, setHidden] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    if (!userId) return
    setLoading(true)

    const [favRes, planRes, hidRes] = await Promise.all([
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
      supabase
        .from('hidden_exercises')
        .select('*')
        .eq('user_id', userId),
    ])

    // Resilient if a table doesn't exist yet — that list just stays empty.
    setFavorites(favRes.error ? [] : (favRes.data || []))
    setHidden(hidRes.error ? [] : (hidRes.data || []))

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
    setAllHistory(hist)
    setLoading(false)
  }, [userId])

  useEffect(() => { fetchAll() }, [fetchAll])

  const favSet = new Set(favorites.map(f => norm(f.exercise_name)))
  const hiddenSet = new Set(hidden.map(h => norm(h.exercise_name)))
  const isFavorite = (name) => favSet.has(norm(name))
  const isHidden = (name) => hiddenSet.has(norm(name))

  const history = allHistory.filter(ex => !hiddenSet.has(norm(ex.exercise_name)))

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
        target_sets: toInt(ex.target_sets),
        target_reps: toInt(ex.target_reps),
        target_weight_kg: toNum(ex.target_weight_kg),
      })
    }
    await fetchAll()
  }

  // Edit a saved exercise in place. Returns an error message, or null on success.
  async function updateFavorite(id, fields) {
    const name = fields.exercise_name?.trim()
    if (!id || !name) return 'Exercise name is required.'

    const { error } = await supabase
      .from('favorite_exercises')
      .update({
        exercise_name: name,
        youtube_url: fields.youtube_url?.trim() || null,
        target_sets: toInt(fields.target_sets),
        target_reps: toInt(fields.target_reps),
        target_weight_kg: toNum(fields.target_weight_kg),
      })
      .eq('id', id)

    if (error) return error.message
    await fetchAll()
    return null
  }

  async function deleteFavorite(id) {
    if (!id) return 'Missing exercise.'
    const { error } = await supabase.from('favorite_exercises').delete().eq('id', id)
    if (error) return error.message
    await fetchAll()
    return null
  }

  // Suppress a derived-history name. Past workouts are left untouched.
  async function hideFromHistory(name) {
    const clean = name?.trim()
    if (!userId || !clean) return 'Missing exercise.'
    const { error } = await supabase
      .from('hidden_exercises')
      .insert({ user_id: userId, exercise_name: clean })
    if (error) return error.message
    await fetchAll()
    return null
  }

  async function unhide(name) {
    const clean = name?.trim()
    if (!userId || !clean) return 'Missing exercise.'
    // Match how the list dedupes (case-insensitive) so the right row is freed.
    const row = hidden.find(h => norm(h.exercise_name) === norm(clean))
    if (!row) return null
    const { error } = await supabase.from('hidden_exercises').delete().eq('id', row.id)
    if (error) return error.message
    await fetchAll()
    return null
  }

  return {
    favorites,
    history,
    allHistory,
    hidden,
    loading,
    isFavorite,
    isHidden,
    toggleFavorite,
    updateFavorite,
    deleteFavorite,
    hideFromHistory,
    unhide,
    refetch: fetchAll,
  }
}
