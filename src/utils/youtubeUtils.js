export function extractYouTubeId(url) {
  if (!url || typeof url !== 'string') return null
  const s = url.trim()
  const patterns = [
    // Standard watch URL (desktop + mobile): youtube.com/watch?v=ID
    /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/watch\?(?:[^#&?]*&)*v=([A-Za-z0-9_-]{11})/,
    // Short URL: youtu.be/ID
    /(?:https?:\/\/)?youtu\.be\/([A-Za-z0-9_-]{11})/,
    // Embed URL: youtube.com/embed/ID
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
    // Shorts: youtube.com/shorts/ID
    /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
    // Old format: youtube.com/v/ID
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([A-Za-z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = s.match(pattern)
    if (match) return match[1]
  }
  return null
}

export function toEmbedUrl(url) {
  const id = extractYouTubeId(url)
  return id ? `https://www.youtube.com/embed/${id}` : null
}
