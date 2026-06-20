import { Card } from '../ui/Card'

export function QuickStats({ healthLog, workoutLog, workoutPlan }) {
  const weight = healthLog?.weight_kg ?? null
  const sleep = healthLog?.sleep_hours ?? null
  const workoutStatus = workoutPlan
    ? (workoutLog?.completed ?? 'planned')
    : 'not planned'

  const statusConfig = {
    yes: { label: 'Completed', color: 'text-sage-700', bg: 'bg-sage-100' },
    partial: { label: 'Partial', color: 'text-amber-800', bg: 'bg-amber-100' },
    no: { label: 'Missed', color: 'text-red-700', bg: 'bg-red-100' },
    planned: { label: 'Planned', color: 'text-blue-700', bg: 'bg-blue-100' },
    'not planned': { label: 'No plan', color: 'text-gray-500', bg: 'bg-gray-100' },
  }

  const ws = statusConfig[workoutStatus] || statusConfig['not planned']

  return (
    <Card className="p-4">
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick stats</p>
      <div className="grid grid-cols-3 gap-2 divide-x divide-gray-100">
        <Stat label="Weight" value={weight != null ? `${weight} kg` : '—'} />
        <Stat label="Sleep" value={sleep != null ? `${sleep}h` : '—'} />
        <div className="flex flex-col items-center gap-1.5 py-1">
          <p className="text-xs text-gray-400 font-medium">Workout</p>
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${ws.color} ${ws.bg}`}>
            {ws.label}
          </span>
        </div>
      </div>
    </Card>
  )
}

function Stat({ label, value }) {
  return (
    <div className="flex flex-col items-center gap-1 py-1">
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <p className="text-lg font-bold text-gray-900 tracking-tight">{value}</p>
    </div>
  )
}
