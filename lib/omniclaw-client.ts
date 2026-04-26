export type OmniClawResponse<T = Record<string, unknown>> = {
  ok: boolean
  unavailable: boolean
  blocked: boolean
  error: string | null
  data: T
}

export type OmniClawBalanceData = {
  wallet_id?: string
  network?: string
  mode?: string
  balances?: {
    eoa_usdc?: string | null
    circle_wallet_usdc?: string | null
    gateway_usdc?: string | null
  }
  raw?: Record<string, unknown>
}

export type OmniClawTransaction = {
  id?: string
  status?: string
  direction?: string
  tx_hash?: string | null
  amount?: string | null
  source?: string | null
  destination?: string | null
  created_at?: string | null
  updated_at?: string | null
  error_reason?: string | null
  arcscan_url?: string | null
}

export type OmniClawConfigData = {
  sdk_installed?: boolean
  circle_api_key_present?: boolean
  entity_secret_present?: boolean
  wallet_id_configured?: boolean
  wallet_set_id_configured?: boolean
  network?: string
  arc_explorer_url?: string
  supports?: Record<string, boolean>
}

export type SessionActivity = {
  kind: "payment" | "deposit" | "withdrawal"
  service: string
  amount: string
  hash: string | null
  status: "completed" | "pending"
  timestamp: string
}

const REQUEST_TIMEOUT_MS = 35_000
export const OMNICLAW_REFRESH_EVENT = "omniclaw:refresh"
export const OMNICLAW_ACTIVITY_EVENT = "omniclaw:activity"

const sessionActivity: SessionActivity[] = []

async function request<T>(
  path: string,
  method: "GET" | "POST",
  body?: Record<string, unknown>
): Promise<OmniClawResponse<T>> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: method === "POST" ? JSON.stringify(body ?? {}) : undefined,
      signal: controller.signal,
      cache: "no-store",
    })

    const payload = (await response.json().catch(() => null)) as
      | OmniClawResponse<T>
      | null

    if (!response.ok || !payload) {
      return {
        ok: false,
        unavailable: !response.ok,
        blocked: false,
        error: payload?.error || `Request failed (${response.status})`,
        data: {} as T,
      }
    }

    return {
      ok: Boolean(payload.ok),
      unavailable: Boolean(payload.unavailable),
      blocked: Boolean(payload.blocked),
      error: payload.error ?? null,
      data: (payload.data ?? {}) as T,
    }
  } catch (error) {
    return {
      ok: false,
      unavailable: true,
      blocked: false,
      error:
        error instanceof Error && error.name === "AbortError"
          ? "Request timed out"
          : error instanceof Error
            ? error.message
            : "Request failed",
      data: {} as T,
    }
  } finally {
    clearTimeout(timeout)
  }
}

export function emitRefreshEvent() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(OMNICLAW_REFRESH_EVENT))
  }
}

export function pushSessionActivity(entry: SessionActivity) {
  sessionActivity.unshift(entry)
  if (sessionActivity.length > 25) {
    sessionActivity.splice(25)
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(OMNICLAW_ACTIVITY_EVENT))
  }
}

export function getSessionActivity(): SessionActivity[] {
  return [...sessionActivity]
}

export function getHealth() {
  return request<Record<string, unknown>>("/api/omniclaw/health", "GET")
}

export function getConfigStatus() {
  return request<OmniClawConfigData>("/api/omniclaw/config-status", "GET")
}

export function getBalance() {
  return request<OmniClawBalanceData>("/api/omniclaw/balance", "GET")
}

export function getTransactions() {
  return request<{ items?: OmniClawTransaction[] }>("/api/omniclaw/transactions", "GET")
}

export function inspectEndpoint(endpoint: string) {
  return request<Record<string, unknown>>("/api/omniclaw/inspect", "POST", {
    endpoint,
  })
}

export function payEndpoint(endpoint: string, amount?: string, purpose?: string) {
  return request<Record<string, unknown>>("/api/omniclaw/pay", "POST", {
    endpoint,
    amount,
    purpose,
  })
}

export function deposit(amount: string) {
  return request<Record<string, unknown>>("/api/omniclaw/deposit", "POST", {
    amount,
  })
}

export function withdraw(amount: string) {
  return request<Record<string, unknown>>("/api/omniclaw/withdraw", "POST", {
    amount,
  })
}

export type ResolveTxData = {
  transaction_id?: string
  tx_hash?: string | null
  arcscan_url?: string | null
  status?: string
}

export function resolveTxHash(transactionId: string) {
  return request<ResolveTxData>(
    `/api/omniclaw/resolve-tx?transaction_id=${encodeURIComponent(transactionId)}`,
    "GET"
  )
}