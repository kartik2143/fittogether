import { useState } from 'react'
import { formatDate } from '../../utils/dateUtils'

export function PhotoTimeline({ logs }) {
  const photos = logs.filter(l => l.photo_url)
  const [expanded, setExpanded] = useState(null)

  if (photos.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-4">No progress photos yet.</p>
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {photos.map(log => (
          <button key={log.id} onClick={() => setExpanded(log)} className="flex flex-col gap-1">
            <img
              src={log.photo_url}
              alt={formatDate(log.date)}
              className="w-full aspect-square object-cover rounded-xl border border-gray-100"
            />
            <p className="text-xs text-gray-400 text-center">{formatDate(log.date)}</p>
          </button>
        ))}
      </div>

      {expanded && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4"
          onClick={() => setExpanded(null)}
        >
          <p className="text-white text-sm mb-3">{formatDate(expanded.date)}</p>
          <img
            src={expanded.photo_url}
            alt={formatDate(expanded.date)}
            className="max-w-full max-h-[80vh] object-contain rounded-xl"
          />
          <p className="text-gray-400 text-xs mt-3">Tap anywhere to close</p>
        </div>
      )}
    </>
  )
}
