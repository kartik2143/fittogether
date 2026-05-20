import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useHealthLogs, useTodayHealthLog } from '../hooks/useHealthLogs'
import { HealthLogForm } from '../components/health/HealthLogForm'
import { HealthLogEntry } from '../components/health/HealthLogEntry'
import { DateNavigator } from '../components/ui/DateNavigator'
import { Card } from '../components/ui/Card'
import { supabase } from '../lib/supabase'
import { todayStr } from '../utils/dateUtils'

export default function DailyHealthTracker() {
  const { profile } = useAuth()
  const [searchParams] = useSearchParams()
  const forId = searchParams.get('for')
  const isCoachMode = !!forId && forId !== profile?.user_id
  const targetUserId = isCoachMode ? forId : profile?.user_id

  const [selectedDate, setSelectedDate] = useState(todayStr())
  const [memberName, setMemberName] = useState('')
  const [supplements, setSupplements] = useState([])
  const [editing, setEditing] = useState(false)

  const { log: todayLog, loading: todayLoading, refetch: refetchToday } = useTodayHealthLog(targetUserId, selectedDate)
  const { logs, loading: histLoading, refetch: refetchHist } = useHealthLogs(targetUserId, 60)

  // Reset editing state when date changes
  useEffect(() => { setEditing(false) }, [selectedDate])

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

  const pastLogs = logs.filter(l => l.date !== selectedDate)

  return (
    <div className="flex flex-col gap-5">
      {isCoachMode ? (
        <Link to={`/profiles/${forId}`}>
          <div className="flex items-center gap-3 bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800/40 rounded-2xl px-4 py-3 active:bg-brand-100 dark:active:bg-brand-900/30 transition-colors">
            <div className="w-9 h-9 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-brand-500 dark:text-brand-400 uppercase tracking-wide">Coach view</p>
              <p className="text-sm font-bold text-brand-900 dark:text-brand-200 truncate">{memberName}</p>
            </div>
            <svg className="w-4 h-4 text-brand-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
        </Link>
      ) : null}
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Health Log</h1>

      <DateNavigator date={selectedDate} onChange={setSelectedDate} disableFuture />

      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="font-semibold text-gray-800">
            {selectedDate === todayStr() ? 'Today' : selectedDate}
          </p>
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
            date={selectedDate}
            existing={editing ? todayLog : undefined}
            supplements={supplements}
            onSaved={handleSaved}
          />
        ) : (
          <HealthLogEntry log={todayLog} />
        )}
      </Card>

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
