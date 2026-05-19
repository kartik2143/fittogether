import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useHealthLogs, useTodayHealthLog } from '../hooks/useHealthLogs'
import { HealthLogForm } from '../components/health/HealthLogForm'
import { HealthLogEntry } from '../components/health/HealthLogEntry'
import { Card } from '../components/ui/Card'
import { supabase } from '../lib/supabase'
import { todayStr } from '../utils/dateUtils'

const today = todayStr()

export default function DailyHealthTracker() {
  const { profile } = useAuth()
  const { log: todayLog, loading: todayLoading, refetch: refetchToday } = useTodayHealthLog(profile?.user_id, today)
  const { logs, loading: histLoading, refetch: refetchHist } = useHealthLogs(profile?.user_id, 60)
  const [supplements, setSupplements] = useState([])
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (!profile?.user_id) return
    supabase
      .from('supplement_list')
      .select('*')
      .eq('user_id', profile.user_id)
      .order('order_index')
      .then(({ data }) => setSupplements(data || []))
  }, [profile?.user_id])

  async function handleSaved() {
    await Promise.all([refetchToday(), refetchHist()])
    setEditing(false)
  }

  const pastLogs = logs.filter(l => l.date !== today)

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold text-gray-900">📋 Daily Health Log</h1>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="font-semibold text-gray-800">Today</p>
          {todayLog && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-sm text-brand-600 font-medium hover:underline"
            >
              Edit
            </button>
          )}
        </div>

        {todayLoading ? (
          <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />
        ) : (!todayLog || editing) ? (
          <HealthLogForm
            userId={profile?.user_id}
            date={today}
            existing={editing ? todayLog : undefined}
            supplements={supplements}
            onSaved={handleSaved}
          />
        ) : (
          <HealthLogEntry log={todayLog} />
        )}
      </Card>

      {/* Past entries */}
      {pastLogs.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Past entries</h2>
          {histLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse" />
              ))
            : pastLogs.map(log => <HealthLogEntry key={log.id} log={log} />)
          }
        </div>
      )}
    </div>
  )
}
