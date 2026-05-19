import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { compressImage } from '../../utils/imageCompression'
import { Button } from '../ui/Button'
import { Input, Textarea } from '../ui/Input'
import { SupplementChecklist } from './SupplementChecklist'

export function HealthLogForm({ userId, date, existing, supplements, onSaved }) {
  const fileRef = useRef(null)
  const [weightKg, setWeightKg] = useState(existing?.weight_kg ?? '')
  const [sleepHours, setSleepHours] = useState(existing?.sleep_hours ?? '')
  const [sleepQuality, setSleepQuality] = useState(existing?.sleep_quality ?? 3)
  const [activityNotes, setActivityNotes] = useState(existing?.activity_notes ?? '')
  const [healthNotes, setHealthNotes] = useState(existing?.health_notes ?? '')
  const [checkedSupps, setCheckedSupps] = useState(existing?.supplements ?? [])
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(existing?.photo_url ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (existing) {
      setWeightKg(existing.weight_kg ?? '')
      setSleepHours(existing.sleep_hours ?? '')
      setSleepQuality(existing.sleep_quality ?? 3)
      setActivityNotes(existing.activity_notes ?? '')
      setHealthNotes(existing.health_notes ?? '')
      setCheckedSupps(existing.supplements ?? [])
      setPhotoPreview(existing.photo_url ?? null)
    }
  }, [existing?.id])

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    let photoUrl = existing?.photo_url ?? null

    if (photoFile) {
      try {
        const compressed = await compressImage(photoFile)
        const path = `${userId}/${date}.jpg`
        const { error: upErr } = await supabase.storage
          .from('progress-photos')
          .upload(path, compressed, { upsert: true, contentType: 'image/jpeg' })
        if (!upErr) {
          const { data: signed } = await supabase.storage
            .from('progress-photos')
            .createSignedUrl(path, 60 * 60 * 24 * 365)
          photoUrl = signed?.signedUrl ?? null
        }
      } catch {
        // non-fatal
      }
    }

    const payload = {
      user_id: userId,
      date,
      weight_kg: weightKg !== '' ? parseFloat(weightKg) : null,
      sleep_hours: sleepHours !== '' ? parseFloat(sleepHours) : null,
      sleep_quality: sleepQuality,
      activity_notes: activityNotes || null,
      health_notes: healthNotes || null,
      photo_url: photoUrl,
      supplements: checkedSupps,
    }

    let err
    if (existing) {
      ;({ error: err } = await supabase.from('health_logs').update(payload).eq('id', existing.id))
    } else {
      ;({ error: err } = await supabase.from('health_logs').insert(payload))
    }

    if (err) {
      setError(err.message)
    } else {
      onSaved?.()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">

      {/* ── Morning section ── */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">🌅 Log now — morning</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Weight (kg)"
          type="number"
          step="0.1"
          min="20"
          max="300"
          value={weightKg}
          onChange={e => setWeightKg(e.target.value)}
          placeholder="e.g. 72.5"
        />
        <Input
          label="Sleep (hours)"
          type="number"
          step="0.5"
          min="0"
          max="24"
          value={sleepHours}
          onChange={e => setSleepHours(e.target.value)}
          placeholder="e.g. 7.5"
        />
      </div>

      {/* Sleep quality */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">Sleep quality</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => setSleepQuality(n)}
              className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-colors
                ${sleepQuality === n
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-brand-300'
                }`}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-400 px-0.5">
          <span>Poor</span><span>Excellent</span>
        </div>
      </div>

      {/* ── Evening section ── */}
      <div className="flex items-center gap-2 mt-1">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">🌙 Add later — end of day</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      <p className="text-xs text-gray-400 -mt-2">Save now with just weight + sleep. Come back to add these later.</p>

      <Textarea
        label="Activity summary"
        value={activityNotes}
        onChange={e => setActivityNotes(e.target.value)}
        placeholder="e.g. Walked 6km to work, 45 min gym"
        rows={2}
      />

      {/* Supplements */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Supplements taken</label>
        <SupplementChecklist
          supplements={supplements}
          checked={checkedSupps}
          onChange={setCheckedSupps}
        />
      </div>

      <Textarea
        label="Health notes (private)"
        value={healthNotes}
        onChange={e => setHealthNotes(e.target.value)}
        placeholder="Anything personal — only you and your coach can see this"
        rows={2}
      />

      {/* ── Photo ── */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">📸 Progress photo</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      <div className="flex flex-col gap-2">
        {photoPreview && (
          <img src={photoPreview} alt="Preview" className="w-24 h-24 rounded-xl object-cover border border-gray-200" />
        )}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-full border-2 border-dashed border-gray-300 rounded-xl py-3 text-sm text-gray-400 hover:border-brand-400 hover:text-brand-600 transition-colors"
        >
          {photoPreview ? 'Change photo' : '+ Add photo'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <Button type="submit" loading={loading} size="lg" className="w-full">
        {existing ? 'Update log' : 'Save log'}
      </Button>
    </form>
  )
}
