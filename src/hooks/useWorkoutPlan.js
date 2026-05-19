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

    const { data: planData } = await supabase
      .from('workout_plans')
      .select('*')
      .eq('for_user_id', forUserId)
      .eq('date', date)
      .maybeSingle()

    setPlan(planData)

    if (planData) {
      const { data: exData } = await supabase
        .from('workout_exercises')
        .select('*')
        .eq('plan_id', planData.id)
        .order('order_index')
      setExercises(exData || [])

      const { data: logData } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('plan_id', planData.id)
        .eq('user_id', forUserId)
        .maybeSingle()
      setLog(logData)
    } else {
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
