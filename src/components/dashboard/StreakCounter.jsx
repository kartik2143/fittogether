import { useStreak } from '../../hooks/useStreak'

export function StreakCounter({ userId }) {
  const { streak, loading } = useStreak(userId)

  return (
    <div className="flex items-center gap-2 bg-orange-50 rounded-2xl px-4 py-3">
      <span className="text-2xl">🔥</span>
      <div>
        <p className="text-xs text-orange-600 font-medium">Current streak</p>
        {loading ? (
          <div className="h-6 w-10 bg-orange-200 rounded animate-pulse" />
        ) : (
          <p className="text-xl font-bold text-orange-700">
            {streak} <span className="text-sm font-normal">{streak === 1 ? 'day' : 'days'}</span>
          </p>
        )}
      </div>
    </div>
  )
}
