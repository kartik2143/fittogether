import { YouTubeEmbed } from './YouTubeEmbed'
import { setsReps } from '../../utils/exerciseFormat'

export function ExerciseRow({ exercise, actual, onChange, readOnly }) {
  const sets = actual?.sets ?? ''
  const reps = actual?.reps ?? ''
  const weight = actual?.weight ?? ''

  const targetText = setsReps(exercise.target_sets, exercise.target_reps)

  function update(field, value) {
    onChange?.({ ...actual, sets, reps, weight, [field]: value, exercise_id: exercise.id })
  }

  return (
    <div className="border border-gray-100 rounded-2xl p-3 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-gray-900 text-[15px] leading-snug">{exercise.exercise_name}</p>
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

      {/* Target — the number you actually read mid-set, so it gets real size. */}
      {targetText && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-baseline gap-2 rounded-xl bg-gray-50 border border-gray-200/80 px-3 py-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Target</span>
            <span className="text-lg font-extrabold text-gray-900 tabular-nums tracking-tight leading-none">
              {targetText}
            </span>
          </span>
          {exercise.target_weight_kg && (
            <span className="inline-flex items-baseline gap-1 rounded-xl bg-gray-50 border border-gray-200/80 px-3 py-1.5">
              <span className="text-lg font-extrabold text-gray-900 tabular-nums tracking-tight leading-none">
                {exercise.target_weight_kg}
              </span>
              <span className="text-xs font-bold text-gray-500">kg</span>
            </span>
          )}
        </div>
      )}

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
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-baseline gap-2 rounded-xl bg-sage-50 border border-sage-100 px-3 py-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sage-700/60">Done</span>
            <span className="text-lg font-extrabold text-sage-700 tabular-nums tracking-tight leading-none">
              {setsReps(actual.sets, actual.reps) || '—'}
            </span>
          </span>
          {actual.weight && (
            <span className="inline-flex items-baseline gap-1 rounded-xl bg-sage-50 border border-sage-100 px-3 py-1.5">
              <span className="text-lg font-extrabold text-sage-700 tabular-nums tracking-tight leading-none">
                {actual.weight}
              </span>
              <span className="text-xs font-bold text-sage-700/70">kg</span>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
