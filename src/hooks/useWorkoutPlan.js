import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useWorkoutPlan(forUserId, date) {
  const [plan, setPlan] = useState(null)
  const [exercises, setExercises] = useState([])
  const [log, setLog] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!forUserId || !date) return
    setLoading(true)

    // Single round trip: plan + exercises + logs via embedded selects.
    const { data } = await supabase
      .from('workout_plans')
      .select('*, workout_exercises(*), workout_logs(*)')
      .eq('for_user_id', forUserId)
      .eq('date', date)
      .order('order_index', { referencedTable: 'workout_exercises' })
      .maybeSingle()

    if (data) {
      const { workout_exercises, workout_logs, ...planData } = data
      setPlan(planData)
      setExercises(workout_exercises || [])
      setLog((workout_logs || []).find(l => l.user_id === forUserId) || null)
    } else {
      setPlan(null)
      setExercises([])
      setLog(null)
    }

    setLoading(false)
  }, [forUserId, date])

  useEffect(() => { fetch() }, [fetch])

  return { plan, exercises, log, loading, refetch: fetch }
}

export function useCoachWorkoutPlans(coachId, memberId) {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!coachId || !memberId) return
    setLoading(true)
    const { data } = await supabase
      .from('workout_plans')
      .select('*')
      .eq('created_by', coachId)
      .eq('for_user_id', memberId)
      .order('date', { ascending: false })
      .limit(30)
    setPlans(data || [])
    setLoading(false)
  }, [coachId, memberId])

  useEffect(() => { fetch() }, [fetch])

  return { plans, loading, refetch: fetch }
}
