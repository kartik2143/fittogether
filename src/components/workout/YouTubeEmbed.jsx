import { useState } from 'react'
import { extractYouTubeId, toEmbedUrl } from '../../utils/youtubeUtils'

/**
 * YouTube embed with a thumbnail facade.
 *
 * The iframe is NOT loaded until the user taps play — only a lightweight
 * thumbnail image is shown by default. This keeps the workout page fast
 * on poor gym connections where loading a full video player would stall
 * the whole page.
 *
 * When tapped, autoplay=1 is added so the video starts immediately
 * without a second tap.
 */
export function YouTubeEmbed({ url, title = 'Video' }) {
  const [active, setActive] = useState(false)

  const id       = extractYouTubeId(url)
  const embedUrl = id ? `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&autoplay=1` : null

  if (!id || !embedUrl) return null

  // YouTube serves thumbnails at three quality levels; hqdefault is reliably
  // available for virtually every video and is ~15–30 KB.
  const thumbUrl = `https://img.youtube.com/vi/${id}/hqdefault.jpg`

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden bg-black"
      style={{ paddingBottom: '56.25%' }}
    >
      {active ? (
        /* ── Active: real iframe ── */
        <iframe
          className="absolute inset-0 w-full h-full"
          src={embedUrl}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        /* ── Idle: thumbnail + play button ── */
        <button
          type="button"
          onClick={() => setActive(true)}
          className="absolute inset-0 w-full h-full group"
          aria-label={`Play ${title}`}
        >
          {/* Thumbnail */}
          <img
            src={thumbUrl}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />

          {/* Dark scrim */}
          <span className="absolute inset-0 bg-black/25 group-active:bg-black/40 transition-colors" />

          {/* YouTube-style play button */}
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="w-14 h-14 bg-[#FF0000] rounded-full flex items-center justify-center shadow-lg
                             group-hover:bg-[#CC0000] group-active:scale-95 transition-all">
              <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </span>

          {/* Title label at bottom */}
          <span className="absolute bottom-0 inset-x-0 px-3 py-2 bg-gradient-to-t from-black/60 to-transparent text-left">
            <span className="text-white text-xs font-medium line-clamp-1">{title}</span>
          </span>
        </button>
      )}
    </div>
  )
}
