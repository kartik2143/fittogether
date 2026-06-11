import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useHealthLogs(userId, limit = 90, columns = '*') {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('health_logs')
      .select(columns)
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit)
    if (err) setError(err.message)
    else setLogs(data || [])
    setLoading(false)
  }, [userId, limit, columns])

  useEffect(() => { fetch() }, [fetch])

  return { logs, loading, error, refetch: fetch }
}

export function useTodayHealthLog(userId, date) {
  const [log, setLog] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!userId || !date) return
    setLoading(true)
    const { data } = await supabase
      .from('health_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .maybeSingle()
    setLog(data)
    setLoading(false)
  }, [userId, date])

  useEffect(() => { fetch() }, [fetch])

  return { log, loading, refetch: fetch }
}
