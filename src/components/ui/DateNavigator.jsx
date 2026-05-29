import { useState, useEffect } from 'react'
import { todayStr } from '../../utils/dateUtils'

const today = todayStr()

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

// Pad to YYYY-MM-DD
function toDateStr(year, month, day) {
  return (
    year +
    '-' + String(month + 1).padStart(2, '0') +
    '-' + String(day).padStart(2, '0')
  )
}

// Monday-based first day offset (Mon=0 … Sun=6)
function firstDayOffset(year, month) {
  const dow = new Date(year, month, 1).getDay() // 0=Sun…6=Sat
  return (dow + 6) % 7
}

export function DateNavigator({ date, onChange, disableFuture = false }) {
  const [viewYear, setViewYear]   = useState(() => parseInt(date.slice(0, 4)))
  const [viewMonth, setViewMonth] = useState(() => parseInt(date.slice(5, 7)) - 1)

  // Keep calendar view in sync when parent changes the selected date
  useEffect(() => {
    setViewYear(parseInt(date.slice(0, 4)))
    setViewMonth(parseInt(date.slice(5, 7)) - 1)
  }, [date])

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const offset      = firstDayOffset(viewYear, viewMonth)

  // Disable "next month" button when disableFuture and next month is entirely in the future
  const nextMonthFirst = viewMonth === 11
    ? toDateStr(viewYear + 1, 0, 1)
    : toDateStr(viewYear, viewMonth + 1, 1)
  const nextDisabled = disableFuture && nextMonthFirst > today

  function goPrevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  function goNextMonth() {
    if (!nextDisabled) {
      if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
      else setViewMonth(m => m + 1)
    }
  }

  function goToday() {
    onChange(today)
    setViewYear(parseInt(today.slice(0, 4)))
    setViewMonth(parseInt(today.slice(5, 7)) - 1)
  }

  const showTodayBtn = date !== today

  return (
    <div className="bg-white rounded-2xl border border-gray-100 px-3 pt-3 pb-2">
      {/* ── Month / year header ── */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={goPrevMonth}
          className="p-1.5 rounded-xl hover:bg-gray-100 active:bg-gray-200 text-gray-400 transition-colors"
          aria-label="Previous month"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <span className="text-sm font-semibold text-gray-800 select-none">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>

        <button
          onClick={goNextMonth}
          disabled={nextDisabled}
          className="p-1.5 rounded-xl hover:bg-gray-100 active:bg-gray-200 text-gray-400 disabled:text-gray-200 disabled:cursor-not-allowed transition-colors"
          aria-label="Next month"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* ── Day-of-week labels ── */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((l, i) => (
          <div key={i} className="flex items-center justify-center h-6">
            <span className="text-[10px] font-semibold text-gray-400 select-none">{l}</span>
          </div>
        ))}
      </div>

      {/* ── Day grid ── */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {/* Leading empty cells */}
        {Array.from({ length: offset }, (_, i) => <div key={`e${i}`} />)}

        {/* Day buttons */}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day      = i + 1
          const dayDate  = toDateStr(viewYear, viewMonth, day)
          const isSelected = dayDate === date
          const isToday    = dayDate === today
          const isFuture   = dayDate > today
          const disabled   = disableFuture && isFuture

          return (
            <button
              key={day}
              onClick={() => !disabled && onChange(dayDate)}
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
              {/* Dot under today (when not selected) */}
              {isToday && !isSelected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-500" />
              )}
            </button>
          )
        })}
      </div>

      {/* ── "Go to today" shortcut ── */}
      {showTodayBtn && (
        <button
          onClick={goToday}
          className="w-full mt-2 text-xs font-semibold text-brand-600 py-1.5 rounded-xl hover:bg-brand-50 active:bg-brand-100 transition-colors"
        >
          Go to today
        </button>
      )}
    </div>
  )
}
