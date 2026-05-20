import { Card } from '../ui/Card'

export function QuickStats({ healthLog, workoutLog, workoutPlan }) {
  const weight = healthLog?.weight_kg ?? null
  const sleep = healthLog?.sleep_hours ?? null
  const workoutStatus = workoutPlan
    ? (workoutLog?.completed ?? 'planned')
    : 'not planned'

  const statusConfig = {
    yes:          { label: 'Completed', color: 'text-green-600  dark:text-green-400',  bg: 'bg-green-50  dark:bg-green-900/20'  },
    partial:      { label: 'Partial',   color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
    no:           { label: 'Missed',    color: 'text-red-600    dark:text-red-400',    bg: 'bg-red-50    dark:bg-red-900/20'    },
    planned:      { label: 'Planned',   color: 'text-blue-600   dark:text-blue-400',   bg: 'bg-blue-50   dark:bg-blue-900/20'   },
    'not planned':{ label: 'No plan',   color: 'text-gray-400   dark:text-gray-500',   bg: 'bg-gray-50   dark:bg-white/5'       },
  }

  const ws = statusConfig[workoutStatus] || statusConfig['not planned']

  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">Quick stats</p>
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Weight" value={weight != null ? `${weight} kg` : '—'} />
        <Stat label="Sleep" value={sleep != null ? `${sleep}h` : '—'} />
        <div className="flex flex-col items-center gap-1 py-2">
          <p className="text-xs text-gray-400 dark:text-gray-500">Workout</p>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ws.color} ${ws.bg}`}>
            {ws.label}
          </span>
        </div>
      </div>
    </Card>
  )
}

function Stat({ label, value }) {
  return (
    <div className="flex flex-col items-center gap-0.5 py-2">
      <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
      <p className="text-base font-semibold text-gray-800 dark:text-gray-100">{value}</p>
    </div>
  )
}
