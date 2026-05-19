import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { todayStr, subtractDays } from '../utils/dateUtils'

export function useStreak(userId) {
  const [streak, setStreak] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    let cancelled = false

    async function calculate() {
      setLoading(true)
      const { data } = await supabase
        .from('health_logs')
        .select('date')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(400)

      if (cancelled || !data) return

      const dateSet = new Set(data.map(r => r.date))
      let count = 0
      let cursor = todayStr()

      while (dateSet.has(cursor)) {
        count++
        cursor = subtractDays(cursor, 1)
      }

      // If today not logged yet, check yesterday (don't break streak mid-day)
      if (count === 0) {
        cursor = subtractDays(todayStr(), 1)
        while (dateSet.has(cursor)) {
          count++
          cursor = subtractDays(cursor, 1)
        }
      }

      setStreak(count)
      setLoading(false)
    }

    calculate()
    return () => { cancelled = true }
  }, [userId])

  return { streak, loading }
}
