export function SupplementChecklist({ supplements, checked, onChange }) {
  if (!supplements || supplements.length === 0) {
    return (
      <p className="text-sm text-gray-400 italic">
        No supplements configured. Add them in Settings.
      </p>
    )
  }

  function toggle(name) {
    if (checked.includes(name)) {
      onChange(checked.filter(s => s !== name))
    } else {
      onChange([...checked, name])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {supplements.map(s => {
        const active = checked.includes(s.name)
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => toggle(s.name)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors
              ${active
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-brand-400'
              }
            `}
          >
            {active ? '✓' : '+'} {s.name}
          </button>
        )
      })}
    </div>
  )
}
