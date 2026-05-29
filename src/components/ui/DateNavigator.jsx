import { useState, useEffect } from 'react'
import { todayStr, addDays, getWeekDays } from '../../utils/dateUtils'

const today = todayStr()

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function toDateStr(year, month, day) {
  return (
    year +
    '-' + String(month + 1).padStart(2, '0') +
    '-' + String(day).padStart(2, '0')
  )
}

function firstDayOffset(year, month) {
  const dow = new Date(year, month, 1).getDay() // 0=Sun…6=Sat
  return (dow + 6) % 7 // Mon-based
}

export function DateNavigator({ date, onChange, disableFuture = false }) {
  const [expanded, setExpanded] = useState(false)
  const [viewYear,  setViewYear]  = useState(() => parseInt(date.slice(0, 4)))
  const [viewMonth, setViewMonth] = useState(() => parseInt(date.slice(5, 7)) - 1)

  // Keep expanded calendar in sync when date changes externally
  useEffect(() => {
    setViewYear(parseInt(date.slice(0, 4)))
    setViewMonth(parseInt(date.slice(5, 7)) - 1)
  }, [date])

  // ── Collapsed (week strip) state ───────────────────────
  const weekDays       = getWeekDays(date)
  const nextMonday     = addDays(weekDays[0], 7)
  const prevMonday     = addDays(weekDays[0], -7)
  const nextWeekDisabled = disableFuture && nextMonday > today

  // Month label always reflects the selected date's month
  const selYear  = parseInt(date.slice(0, 4))
  const selMonth = parseInt(date.slice(5, 7)) - 1

  // ── Expanded (monthly grid) state ──────────────────────
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const offset      = firstDayOffset(viewYear, viewMonth)
  const nextMonthFirst = viewMonth === 11
    ? toDateStr(viewYear + 1, 0, 1)
    : toDateStr(viewYear, viewMonth + 1, 1)
  const nextMonthDisabled = disableFuture && nextMonthFirst > today

  function goPrevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  function goNextMonth() {
    if (!nextMonthDisabled) {
      if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
      else setViewMonth(m => m + 1)
    }
  }

  function handleDaySelect(dayDate) {
    onChange(dayDate)
    setExpanded(false) // collapse after picking
  }

  function goToday() {
    onChange(today)
    setExpanded(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100">

      {/* ── Always-visible: month label + chevron (tap to expand) ── */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-3 pt-2.5 pb-1"
      >
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider select-none">
          {MONTH_NAMES[selMonth]} {selYear}
        </span>
        <svg
          className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {!expanded ? (
        /* ══ COLLAPSED: week strip (original feel + month name above) ══ */
        <div className="flex items-center gap-1 px-2 pb-2">
          <button
            onClick={() => onChange(prevMonday)}
            className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 active:bg-gray-200 transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex-1 grid grid-cols-7 gap-0.5">
            {weekDays.map((day, i) => {
              const isSelected = day === date
              const isToday    = day === today
              const isFuture   = day > today
              const disabled   = disableFuture && isFuture
              const dayNum     = parseInt(day.slice(8), 10)

              return (
                <button
                  key={day}
                  onClick={() => !disabled && onChange(day)}
                  disabled={disabled}
                  className={[
                    'flex flex-col items-center py-1.5 rounded-xl transition-colors',
                    isSelected
                      ? 'bg-brand-600 text-white'
                      : disabled
                      ? 'text-gray-300 cursor-not-allowed'
                      : isToday
                      ? 'text-brand-600 hover:bg-brand-50'
                      : 'text-gray-600 hover:bg-gray-100',
                  ].join(' ')}
                >
                  <span className="text-[10px] font-medium">{DAY_LABELS[i]}</span>
                  <span className="text-sm font-bold leading-tight">{dayNum}</span>
                  {isToday && !isSelected && (
                    <span className="w-1 h-1 rounded-full bg-brand-400 mt-0.5" />
                  )}
                </button>
              )
            })}
          </div>

          <button
            onClick={() => !nextWeekDisabled && onChange(nextMonday)}
            disabled={nextWeekDisabled}
            className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 active:bg-gray-200 disabled:text-gray-200 transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      ) : (
        /* ══ EXPANDED: full monthly calendar ══ */
        <div className="px-3 pb-3">

          {/* Month navigation */}
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={goPrevMonth}
              className="p-1.5 rounded-xl hover:bg-gray-100 active:bg-gray-200 text-gray-400 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-gray-700 select-none">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button
              onClick={goNextMonth}
              disabled={nextMonthDisabled}
              className="p-1.5 rounded-xl hover:bg-gray-100 active:bg-gray-200 text-gray-400 disabled:text-gray-200 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day-of-week labels */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_LABELS.map((l, i) => (
              <div key={i} className="flex items-center justify-center h-6">
                <span className="text-[10px] font-semibold text-gray-400 select-none">{l}</span>
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {Array.from({ length: offset }, (_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day     = i + 1
              const dayDate = toDateStr(viewYear, viewMonth, day)
              const isSelected = dayDate === date
              const isToday    = dayDate === today
              const disabled   = disableFuture && dayDate > today

              return (
                <button
                  key={day}
                  onClick={() => !disabled && handleDaySelect(dayDate)}
                  disabled={disabled}
                  className={[
                    'relative flex flex-col items-center justify-center h-8 w-full rounded-xl transition-colors text-sm',
                    isSelected
                      ? 'bg-brand-600 text-white font-bold'
                      : disabled
                      ? 'text-gray-200 cursor-not-allowed'
                      : isToday
                      ? 'text-brand-600 font-bold hover:bg-brand-50'
                      : 'text-gray-700 font-medium hover:bg-gray-100',
                  ].join(' ')}
                >
                  {day}
                  {isToday && !isSelected && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-500" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Go to today shortcut */}
          {date !== today && (
            <button
              onClick={goToday}
              className="w-full mt-2 text-xs font-semibold text-brand-600 py-1.5 rounded-xl hover:bg-brand-50 active:bg-brand-100 transition-colors"
            >
              Go to today
            </button>
          )}
        </div>
      )}
    </div>
  )
}
