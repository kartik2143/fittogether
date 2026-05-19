import { todayStr, getWeekDays, addDays } from '../../utils/dateUtils'

const today = todayStr()
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export function DateNavigator({ date, onChange, disableFuture = false }) {
  const weekDays = getWeekDays(date)
  const nextMonday = addDays(weekDays[0], 7)
  const nextDisabled = disableFuture && nextMonday > today

  return (
    <div className="flex items-center gap-1 bg-white rounded-apple-lg shadow-apple-card px-2 py-2">
      <button
        onClick={() => onChange(addDays(weekDays[0], -7))}
        className="p-2 rounded-apple text-gray-400 active:bg-[#F2F2F7] transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="flex-1 grid grid-cols-7 gap-0.5">
        {weekDays.map((day, i) => {
          const isSelected = day === date
          const isToday    = day === today
          const disabled   = disableFuture && day > today
          const dayNum     = parseInt(day.slice(8), 10)

          return (
            <button
              key={day}
              onClick={() => !disabled && onChange(day)}
              disabled={disabled}
              className={[
                'flex flex-col items-center py-1.5 rounded-apple transition-colors',
                isSelected
                  ? 'bg-brand-600 text-white'
                  : disabled
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-700 active:bg-[#F2F2F7]',
              ].join(' ')}
            >
              <span className={`text-[10px] font-medium ${isSelected ? 'text-white/70' : isToday ? 'text-brand-600' : 'text-gray-400'}`}>
                {DAY_LABELS[i]}
              </span>
              <span className={`text-[15px] font-semibold leading-tight tracking-tight ${isToday && !isSelected ? 'text-brand-600' : ''}`}>
                {dayNum}
              </span>
              {isToday && !isSelected && (
                <span className="w-1 h-1 rounded-full bg-brand-500 mt-0.5" />
              )}
            </button>
          )
        })}
      </div>

      <button
        onClick={() => !nextDisabled && onChange(nextMonday)}
        disabled={nextDisabled}
        className="p-2 rounded-apple text-gray-400 active:bg-[#F2F2F7] disabled:text-gray-200 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}
