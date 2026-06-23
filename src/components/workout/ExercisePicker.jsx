import { useState } from 'react'

function metaLine(ex) {
  const parts = []
  if (ex.target_sets) parts.push(`${ex.target_sets}${ex.target_reps ? `×${ex.target_reps}` : ' sets'}`)
  else if (ex.target_reps) parts.push(`${ex.target_reps} reps`)
  if (ex.target_weight_kg) parts.push(`@ ${ex.target_weight_kg}kg`)
  if (ex.youtube_url) parts.push('▸ video')
  return parts.join(' ')
}

const rowKey = (ex) => (ex.id ? `f${ex.id}` : `h${(ex.exercise_name || '').toLowerCase()}`)

function StarIcon({ filled }) {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={filled ? 0 : 1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.5a.56.56 0 011.04 0l2.12 4.92 5.34.46c.5.04.7.66.32.99l-4.05 3.5 1.21 5.22c.11.49-.42.87-.85.61L12 16.9l-4.61 2.8c-.43.26-.96-.12-.85-.61l1.21-5.22-4.05-3.5a.56.56 0 01.32-.99l5.34-.46 2.12-4.92z" />
    </svg>
  )
}

export function ExercisePicker({ open, onClose, onPick, favorites, history, isFavorite, onToggleFavorite }) {
  const [query, setQuery] = useState('')
  const [added, setAdded] = useState(() => new Set())

  if (!open) return null

  const q = query.trim().toLowerCase()
  const match = (ex) => !q || (ex.exercise_name || '').toLowerCase().includes(q)
  const favs = favorites.filter(match)
  // Don't repeat a favourite down in history.
  const hist = history.filter(ex => match(ex) && !isFavorite(ex.exercise_name))

  function handlePick(ex) {
    onPick(ex)
    setAdded(prev => new Set(prev).add(rowKey(ex)))
  }

  const Row = ({ ex }) => {
    const fav = isFavorite(ex.exercise_name)
    const isAdded = added.has(rowKey(ex))
    const sub = metaLine(ex)
    return (
      <div className="flex items-center gap-1.5 py-1.5">
        <button
          type="button"
          onClick={() => onToggleFavorite(ex)}
          aria-label={fav ? 'Remove from favourites' : 'Add to favourites'}
          className={`p-1.5 rounded-lg transition-colors ${fav ? 'text-brand-500' : 'text-gray-300 hover:text-gray-400'}`}
        >
          <StarIcon filled={fav} />
        </button>
        <button type="button" onClick={() => handlePick(ex)} className="flex-1 text-left min-w-0 py-1">
          <p className="text-sm font-semibold text-gray-900 truncate">{ex.exercise_name}</p>
          {sub && <p className="text-xs text-gray-500 truncate mt-0.5">{sub}</p>}
        </button>
        <button
          type="button"
          onClick={() => handlePick(ex)}
          className={`text-xs font-semibold rounded-lg px-2.5 py-1.5 flex-shrink-0 transition-colors ${
            isAdded ? 'text-sage-700 bg-sage-100' : 'text-brand-700 bg-brand-50 hover:bg-brand-100'
          }`}
        >
          {isAdded ? 'Added ✓' : 'Add'}
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-lift border-t border-gray-200/60 max-h-[82vh] flex flex-col">
        {/* Header + search */}
        <div className="px-4 pt-3 pb-3 border-b border-gray-100 flex-shrink-0">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-200" />
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 text-[17px]">Add exercise</h2>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') e.preventDefault() }}
            placeholder="Search your exercises…"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/70 focus:border-brand-400"
          />
        </div>

        {/* Lists */}
        <div className="overflow-y-auto px-4 py-2 flex-1">
          {favs.length === 0 && hist.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">
              {query
                ? 'No matches.'
                : 'No saved exercises yet. Star exercises to build your favourites.'}
            </p>
          ) : (
            <>
              {favs.length > 0 && (
                <Section title="⭐ Favourites">
                  {favs.map(ex => <Row key={rowKey(ex)} ex={ex} />)}
                </Section>
              )}
              {hist.length > 0 && (
                <Section title="🕒 From history">
                  {hist.map(ex => <Row key={rowKey(ex)} ex={ex} />)}
                </Section>
              )}
            </>
          )}
        </div>

        <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0 safe-bottom">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-gray-900 text-white font-semibold text-sm active:scale-[0.98] transition-transform"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="mb-2">
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-1 pt-2 pb-1">{title}</p>
      <div className="divide-y divide-gray-50">{children}</div>
    </div>
  )
}
