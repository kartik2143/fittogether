import { useState } from 'react'
import { metaLine } from '../../utils/exerciseFormat'

const blankDraft = (ex) => ({
  exercise_name: ex.exercise_name ?? '',
  youtube_url: ex.youtube_url ?? '',
  target_sets: ex.target_sets ?? '',
  target_reps: ex.target_reps ?? '',
  target_weight_kg: ex.target_weight_kg ?? '',
})

const fieldClass =
  'w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/70 focus:border-brand-400'

export function ExerciseManager({ open, onClose, library, ownerName }) {
  const [tab, setTab] = useState('saved')
  const [query, setQuery] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  if (!open) return null

  const {
    favorites, allHistory, loading,
    isFavorite, isHidden,
    updateFavorite, deleteFavorite,
    hideFromHistory, unhide, toggleFavorite,
  } = library

  const q = query.trim().toLowerCase()
  const match = (ex) => !q || (ex.exercise_name || '').toLowerCase().includes(q)

  const savedList = favorites.filter(match)
  // Everything ever used, minus what's already curated into the saved list.
  const historyList = allHistory.filter(ex => match(ex) && !isFavorite(ex.exercise_name))

  function startEdit(ex) {
    setError('')
    setConfirmDelete(null)
    setEditingId(ex.id)
    setDraft(blankDraft(ex))
  }

  function cancelEdit() {
    setEditingId(null)
    setDraft(null)
    setError('')
  }

  // Every library mutation returns an error string or null, so one wrapper
  // handles the busy flag and error surfacing for all of them.
  async function run(fn) {
    setBusy(true)
    setError('')
    const err = await fn()
    setBusy(false)
    if (err) { setError(err); return false }
    return true
  }

  async function saveEdit() {
    const ok = await run(() => updateFavorite(editingId, draft))
    if (ok) cancelEdit()
  }

  const Tab = ({ id, label, count }) => (
    <button
      type="button"
      onClick={() => { setTab(id); cancelEdit(); setConfirmDelete(null) }}
      className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
        tab === id ? 'bg-white text-gray-900 shadow-card' : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {label} <span className="text-xs font-medium opacity-60">{count}</span>
    </button>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-lift border-t border-gray-200/60 max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="px-4 pt-3 pb-3 border-b border-gray-100 flex-shrink-0">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-200" />
          <div className="flex items-center justify-between mb-3">
            <div className="min-w-0">
              <h2 className="font-bold text-gray-900 text-[17px] truncate">Manage exercises</h2>
              {ownerName && <p className="text-xs text-gray-500 truncate">{ownerName}'s library</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 transition-colors flex-shrink-0"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl mb-3">
            <Tab id="saved" label="⭐ Saved" count={favorites.length} />
            <Tab id="history" label="🕒 Recently used" count={historyList.length} />
          </div>

          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') e.preventDefault() }}
            placeholder="Search exercises…"
            className={fieldClass}
          />
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-4 py-2 flex-1">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 my-2">{error}</p>
          )}

          {loading ? (
            <p className="text-sm text-gray-400 text-center py-10">Loading…</p>
          ) : tab === 'saved' ? (
            savedList.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">
                {query
                  ? 'No matches.'
                  : 'Nothing saved yet. Star exercises in "Recently used" to build this list.'}
              </p>
            ) : (
              <div className="divide-y divide-gray-50">
                {savedList.map(ex => (
                  <div key={ex.id} className="py-2.5">
                    {editingId === ex.id ? (
                      <div className="flex flex-col gap-2">
                        <input
                          value={draft.exercise_name}
                          onChange={e => setDraft({ ...draft, exercise_name: e.target.value })}
                          placeholder="Exercise name"
                          className={fieldClass}
                          autoFocus
                        />
                        <input
                          value={draft.youtube_url}
                          onChange={e => setDraft({ ...draft, youtube_url: e.target.value })}
                          placeholder="YouTube URL (optional)"
                          className={fieldClass}
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="number" inputMode="numeric"
                            value={draft.target_sets}
                            onChange={e => setDraft({ ...draft, target_sets: e.target.value })}
                            placeholder="Sets" className={fieldClass}
                          />
                          <input
                            type="number" inputMode="numeric"
                            value={draft.target_reps}
                            onChange={e => setDraft({ ...draft, target_reps: e.target.value })}
                            placeholder="Reps" className={fieldClass}
                          />
                          <input
                            type="number" inputMode="decimal" step="0.5"
                            value={draft.target_weight_kg}
                            onChange={e => setDraft({ ...draft, target_weight_kg: e.target.value })}
                            placeholder="Weight" className={fieldClass}
                          />
                        </div>
                        <div className="flex gap-2 pt-0.5">
                          <button
                            type="button" onClick={saveEdit} disabled={busy}
                            className="flex-1 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold disabled:opacity-50"
                          >
                            {busy ? 'Saving…' : 'Save'}
                          </button>
                          <button
                            type="button" onClick={cancelEdit} disabled={busy}
                            className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : confirmDelete === ex.id ? (
                      <div className="flex items-center gap-2">
                        <p className="flex-1 text-sm text-gray-700 min-w-0">
                          Delete <b className="font-semibold">{ex.exercise_name}</b>?
                        </p>
                        <button
                          type="button" disabled={busy}
                          onClick={async () => {
                            const ok = await run(() => deleteFavorite(ex.id))
                            if (ok) setConfirmDelete(null)
                          }}
                          className="text-xs font-semibold rounded-lg px-2.5 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
                        >
                          Delete
                        </button>
                        <button
                          type="button" onClick={() => setConfirmDelete(null)} disabled={busy}
                          className="text-xs font-semibold rounded-lg px-2.5 py-1.5 text-gray-500 hover:bg-gray-100"
                        >
                          Keep
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{ex.exercise_name}</p>
                          {metaLine(ex) && <p className="text-xs text-gray-500 truncate mt-0.5">{metaLine(ex)}</p>}
                        </div>
                        <button
                          type="button" onClick={() => startEdit(ex)}
                          className="text-xs font-semibold rounded-lg px-2.5 py-1.5 text-brand-700 bg-brand-50 hover:bg-brand-100 flex-shrink-0"
                        >
                          Edit
                        </button>
                        <button
                          type="button" onClick={() => { setConfirmDelete(ex.id); setError('') }}
                          className="text-xs font-semibold rounded-lg px-2.5 py-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : historyList.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">
              {query ? 'No matches.' : 'No past exercises found.'}
            </p>
          ) : (
            <>
              <p className="text-[11px] text-gray-400 px-1 pt-2 pb-1 leading-relaxed">
                Pulled from past workouts. Hiding one only removes it from these
                lists — the workout it came from is not changed.
              </p>
              <div className="divide-y divide-gray-50">
                {historyList.map(ex => {
                  const hiddenNow = isHidden(ex.exercise_name)
                  return (
                    <div
                      key={(ex.exercise_name || '').toLowerCase()}
                      className={`flex items-center gap-2 py-2.5 ${hiddenNow ? 'opacity-45' : ''}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{ex.exercise_name}</p>
                        {metaLine(ex) && <p className="text-xs text-gray-500 truncate mt-0.5">{metaLine(ex)}</p>}
                      </div>

                      {hiddenNow ? (
                        <button
                          type="button" disabled={busy}
                          onClick={() => run(() => unhide(ex.exercise_name))}
                          className="text-xs font-semibold rounded-lg px-2.5 py-1.5 text-gray-600 bg-gray-100 hover:bg-gray-200 flex-shrink-0 disabled:opacity-50"
                        >
                          Unhide
                        </button>
                      ) : (
                        <>
                          <button
                            type="button" disabled={busy}
                            onClick={() => run(async () => { await toggleFavorite(ex); return null })}
                            className="text-xs font-semibold rounded-lg px-2.5 py-1.5 text-brand-700 bg-brand-50 hover:bg-brand-100 flex-shrink-0 disabled:opacity-50"
                          >
                            ★ Save
                          </button>
                          <button
                            type="button" disabled={busy}
                            onClick={() => run(() => hideFromHistory(ex.exercise_name))}
                            className="text-xs font-semibold rounded-lg px-2.5 py-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0 disabled:opacity-50"
                          >
                            Hide
                          </button>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
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
