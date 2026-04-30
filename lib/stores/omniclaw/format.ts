export function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

// Always 6 decimal places so nanopayments are visible, e.g. 0.000440 USDC.
export function formatAtomicUsdc(value: number, digits = 6) {
  return `${(value / 1_000_000).toFixed(digits)} USDC`
}

// Returns just the number string. Callers append "USDC" themselves.
export function formatAtomicAmount(value: number, digits = 6) {
  return (value / 1_000_000).toFixed(digits)
}

export function shortenEndpoint(value: string) {
  try {
    const url = new URL(value)
    return url.pathname.replace(/^\/apis\/v2\//, "")
  } catch {
    return value
  }
}
