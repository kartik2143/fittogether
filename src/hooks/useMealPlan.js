import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useMealPlan(forUserId, date) {
  const [plan, setPlan] = useState(null)
  const [log, setLog] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!forUserId || !date) return
    setLoading(true)

    // Single round trip: plan + logs via embedded select.
    const { data } = await supabase
      .from('meal_plans')
      .select('*, meal_logs(*)')
      .eq('for_user_id', forUserId)
      .eq('date', date)
      .maybeSingle()

    if (data) {
      const { meal_logs, ...planData } = data
      setPlan(planData)
      setLog((meal_logs || []).find(l => l.user_id === forUserId) || null)
    } else {
      setPlan(null)
      setLog(null)
    }

    setLoading(false)
  }, [forUserId, date])

  useEffect(() => { fetch() }, [fetch])

  return { plan, log, loading, refetch: fetch }
}
