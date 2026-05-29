import { YouTubeEmbed } from './YouTubeEmbed'

export function ExerciseRow({ exercise, actual, onChange, readOnly }) {
  const sets = actual?.sets ?? ''
  const reps = actual?.reps ?? ''
  const weight = actual?.weight ?? ''

  function update(field, value) {
    onChange?.({ ...actual, sets, reps, weight, [field]: value, exercise_id: exercise.id })
  }

  return (
    <div className="border border-gray-100 rounded-2xl p-3 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-gray-800 text-sm">{exercise.exercise_name}</p>
        {exercise.youtube_url && (
          <button
            type="button"
            onClick={() => window.open(exercise.youtube_url, '_blank', 'noopener,noreferrer')}
            className="text-xs text-brand-600 whitespace-nowrap hover:underline"
          >
            Watch ↗
          </button>
        )}
      </div>

      {exercise.youtube_url && <YouTubeEmbed url={exercise.youtube_url} title={exercise.exercise_name} />}

      {/* Target */}
      <div className="flex gap-3 text-xs text-gray-500">
        <span>Target: <b className="text-gray-700">{exercise.target_sets}×{exercise.target_reps}</b></span>
        {exercise.target_weight_kg && <span>@ <b className="text-gray-700">{exercise.target_weight_kg}kg</b></span>}
      </div>

      {/* Actual log inputs */}
      {!readOnly && (
        <div className="grid grid-cols-3 gap-2 mt-1">
          {[
            { label: 'Sets done', field: 'sets', value: sets, placeholder: exercise.target_sets },
            { label: 'Reps done', field: 'reps', value: reps, placeholder: exercise.target_reps },
            { label: 'Weight kg', field: 'weight', value: weight, placeholder: exercise.target_weight_kg || '—' },
          ].map(({ label, field, value, placeholder }) => (
            <div key={field} className="flex flex-col gap-0.5">
              <label className="text-xs text-gray-400">{label}</label>
              <input
                type="number"
                step="0.5"
                value={value}
                onChange={e => update(field, e.target.value)}
                placeholder={placeholder}
                className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          ))}
        </div>
      )}

      {/* Read-only actuals */}
      {readOnly && actual && (
        <div className="flex gap-3 text-xs text-gray-500">
          <span>Done: <b className="text-gray-700">{actual.sets ?? '—'}×{actual.reps ?? '—'}</b></span>
          {actual.weight && <span>@ <b className="text-gray-700">{actual.weight}kg</b></span>}
        </div>
      )}
    </div>
  )
}
