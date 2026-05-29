import { toEmbedUrl } from '../../utils/youtubeUtils'

export function YouTubeEmbed({ url, title = 'Video' }) {
  const embedUrl = toEmbedUrl(url)
  if (!embedUrl) return null

  return (
    <div className="relative w-full rounded-xl overflow-hidden" style={{ paddingBottom: '56.25%' }}>
      <iframe
        className="absolute inset-0 w-full h-full"
        src={`${embedUrl}?rel=0&modestbranding=1`}
        title={title}
        frameBorder="0"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  )
}
