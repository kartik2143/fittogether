import { useStreak } from '../../hooks/useStreak'

export function StreakCounter({ userId }) {
  const { streak, loading } = useStreak(userId)

  return (
    <div className="flex items-center gap-3 bg-brand-50 border border-brand-100 rounded-2xl px-4 py-3.5">
      <span className="text-2xl">🔥</span>
      <div>
        <p className="text-[11px] text-brand-700/70 font-semibold uppercase tracking-wide">Current streak</p>
        {loading ? (
          <div className="h-6 w-12 bg-brand-100 rounded animate-pulse mt-0.5" />
        ) : (
          <p className="text-xl font-extrabold text-brand-800 leading-tight">
            {streak} <span className="text-sm font-medium text-brand-600">{streak === 1 ? 'day' : 'days'}</span>
          </p>
        )}
      </div>
    </div>
  )
}
