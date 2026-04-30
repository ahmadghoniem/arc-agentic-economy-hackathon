type ApiResult<T = unknown> = {
  success: boolean
  data?: T
  error?: string
}

export async function fetchJson<T>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(url, init)
  const payload = (await res.json().catch(() => ({}))) as ApiResult<T>

  if (!res.ok || !payload.success) {
    throw new Error(payload.error || `${res.status} ${res.statusText}`)
  }

  return payload.data as T
}
