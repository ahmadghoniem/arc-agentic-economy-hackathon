export function formatTruncatedHash(value: string) {
  const text = value.trim()
  if (text.length <= 14) return text

  const prefix = text.slice(0, 6)
  const suffix = text.slice(-4)
  return `${prefix}...${suffix}`
}

export function relativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.max(1, Math.round(diff / 60000))
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  return `${Math.round(hours / 24)}d ago`
}
