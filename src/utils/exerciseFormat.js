// Warm-ups and time-based moves often carry only one of sets/reps (or
// neither), so render whatever exists rather than a half-empty "1×".
export function setsReps(sets, reps) {
  if (sets && reps) return `${sets}×${reps}`
  if (sets) return `${sets} ${Number(sets) === 1 ? 'set' : 'sets'}`
  if (reps) return `${reps} reps`
  return ''
}

// One-line "3×12 · @ 8kg · ▸ video" summary for list rows.
export function metaLine(ex) {
  const parts = []
  const sr = setsReps(ex.target_sets, ex.target_reps)
  if (sr) parts.push(sr)
  if (ex.target_weight_kg) parts.push(`@ ${ex.target_weight_kg}kg`)
  if (ex.youtube_url) parts.push('▸ video')
  return parts.join(' · ')
}
