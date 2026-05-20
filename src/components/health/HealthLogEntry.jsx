import { formatDate } from '../../utils/dateUtils'
import { useState } from 'react'

export function HealthLogEntry({ log }) {
  const [photoOpen, setPhotoOpen] = useState(false)

  const sleepStars = log.sleep_quality
    ? '★'.repeat(log.sleep_quality) + '☆'.repeat(5 - log.sleep_quality)
    : null

  return (
    <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-100 dark:border-white/10 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{formatDate(log.date)}</p>
        {log.photo_url && (
          <button onClick={() => setPhotoOpen(true)}>
            <img src={log.photo_url} alt="Progress" className="w-10 h-10 rounded-lg object-cover border border-gray-200 dark:border-white/10" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        {log.weight_kg && <Stat label="Weight" value={`${log.weight_kg} kg`} />}
        {log.sleep_hours && (
          <Stat label="Sleep" value={`${log.sleep_hours}h ${sleepStars ? `(${sleepStars})` : ''}`} />
        )}
        {log.activity_notes && (
          <div className="col-span-2">
            <span className="text-xs text-gray-400 dark:text-gray-500">Activity: </span>
            <span className="text-gray-700 dark:text-gray-300">{log.activity_notes}</span>
          </div>
        )}
      </div>

      {log.supplements && log.supplements.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {log.supplements.map(s => (
            <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 font-medium">
              ✓ {s}
            </span>
          ))}
        </div>
      )}

      {/* Full-screen photo modal */}
      {photoOpen && log.photo_url && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center" onClick={() => setPhotoOpen(false)}>
          <img src={log.photo_url} alt="Progress" className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div>
      <span className="text-xs text-gray-400 dark:text-gray-500">{label}: </span>
      <span className="text-gray-700 dark:text-gray-300 font-medium">{value}</span>
    </div>
  )
}
