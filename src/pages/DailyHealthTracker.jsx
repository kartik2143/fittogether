import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
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
  const [searchParams] = useSearchParams()
  const forId = searchParams.get('for')
  const isCoachMode = !!forId && forId !== profile?.user_id
  const targetUserId = isCoachMode ? forId : profile?.user_id

  const [memberName, setMemberName] = useState('')
  const [supplements, setSupplements] = useState([])
  const [editing, setEditing] = useState(false)

  const { log: todayLog, loading: todayLoading, refetch: refetchToday } = useTodayHealthLog(targetUserId, today)
  const { logs, loading: histLoading, refetch: refetchHist } = useHealthLogs(targetUserId, 60)

  useEffect(() => {
    if (!targetUserId) return
    supabase
      .from('supplement_list')
      .select('*')
      .eq('user_id', targetUserId)
      .order('order_index')
      .then(({ data }) => setSupplements(data || []))
  }, [targetUserId])

  useEffect(() => {
    if (!isCoachMode) return
    supabase.from('profiles').select('display_name').eq('user_id', forId).single()
      .then(({ data }) => setMemberName(data?.display_name || 'Member'))
  }, [forId, isCoachMode])

  async function handleSaved() {
    await Promise.all([refetchToday(), refetchHist()])
    setEditing(false)
  }

  const pastLogs = logs.filter(l => l.date !== today)

  return (
    <div className="flex flex-col gap-5">
      {isCoachMode && (
        <Link to={`/profiles/${forId}`} className="text-sm text-brand-600 hover:underline">
          ← Back to {memberName}'s profile
        </Link>
      )}
      <h1 className="text-xl font-bold text-gray-900">
        📋 {isCoachMode ? `${memberName}'s Health Log` : 'Daily Health Log'}
      </h1>

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
            userId={targetUserId}
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
