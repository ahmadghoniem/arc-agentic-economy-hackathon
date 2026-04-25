export function formatTruncatedHash(value: string) {
  const text = value.trim()
  if (text.length <= 14) return text

  const prefix = text.slice(0, 6)
  const suffix = text.slice(-4)
  return `${prefix}...${suffix}`
}
