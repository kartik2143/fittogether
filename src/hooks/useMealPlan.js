import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useMealPlan(forUserId, date) {
  const [plan, setPlan] = useState(null)
  const [log, setLog] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!forUserId || !date) return
    setLoading(true)

    const { data: planData } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('for_user_id', forUserId)
      .eq('date', date)
      .maybeSingle()

    setPlan(planData)

    if (planData) {
      const { data: logData } = await supabase
        .from('meal_logs')
        .select('*')
        .eq('plan_id', planData.id)
        .eq('user_id', forUserId)
        .maybeSingle()
      setLog(logData)
    } else {
      setLog(null)
    }

    setLoading(false)
  }, [forUserId, date])

  useEffect(() => { fetch() }, [fetch])

  return { plan, log, loading, refetch: fetch }
}
