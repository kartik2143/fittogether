import { Textarea } from '../ui/Input'

export function MealSlot({ emoji, label, planned, plannedNotes, actual, onChange, readOnly, alwaysEditable }) {
  const showPlan = planned && !alwaysEditable
  const isEditable = !readOnly && (alwaysEditable || !planned)

  return (
    <div className="border border-gray-100 rounded-2xl p-3 flex flex-col gap-2">
      <p className="font-semibold text-sm text-gray-800">{emoji} {label}</p>

      {planned && (
        <div className="bg-gray-50 rounded-xl px-3 py-2">
          <p className="text-xs text-gray-400 mb-0.5">Planned</p>
          <p className="text-sm text-gray-700">{planned}</p>
          {plannedNotes && <p className="text-xs text-gray-400 mt-1 italic">{plannedNotes}</p>}
        </div>
      )}

      {!readOnly && (
        <Textarea
          placeholder={planned ? 'Log what you actually ate (or leave blank to confirm plan)' : `What did you have for ${label.toLowerCase()}?`}
          value={actual ?? ''}
          onChange={e => onChange?.(e.target.value)}
          rows={2}
        />
      )}

      {readOnly && actual && (
        <div className="bg-white rounded-xl px-3 py-2 border border-gray-100">
          <p className="text-xs text-gray-400 mb-0.5">Logged</p>
          <p className="text-sm text-gray-700">{actual}</p>
        </div>
      )}
    </div>
  )
}
