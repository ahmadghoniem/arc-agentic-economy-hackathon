const DEFAULT_OMNICLAW_API_URL = "http://localhost:8080"

const OMNICLAW_API_URL =
  process.env.OMNICLAW_API_URL || DEFAULT_OMNICLAW_API_URL
const OMNICLAW_API_TOKEN =
  process.env.OMNICLAW_API_TOKEN || process.env.OMNICLAW_AGENT_TOKEN

export type ApiTemplate = {
  id: string
  name: string
  url: string
  method: "GET" | "POST"
  body?: string
  headers?: Record<string, string>
}

export type ProxyResult<T = unknown> =
  | { success: true; data: T; timestamp: string }
  | { success: false; error: string; timestamp: string }

function timestamp() {
  return new Date().toISOString()
}

function headers() {
  if (!OMNICLAW_API_TOKEN) {
    throw new Error("OMNICLAW_API_TOKEN is required")
  }

  return {
    Authorization: `Bearer ${OMNICLAW_API_TOKEN}`,
    "Content-Type": "application/json",
  }
}

async function parseResponse(res: Response) {
  const payload = await res.json().catch(() => null)
  if (!res.ok) {
    const detail =
      typeof payload?.detail === "string"
        ? payload.detail
        : typeof payload?.error === "string"
          ? payload.error
          : JSON.stringify(payload)
    throw new Error(detail || `${res.status} ${res.statusText}`)
  }
  return payload
}

export async function getOmniClaw(path: string) {
  const res = await fetch(`${OMNICLAW_API_URL}${path}`, {
    method: "GET",
    headers: headers(),
    cache: "no-store",
  })
  return parseResponse(res)
}

export async function postOmniClaw(path: string, body?: unknown) {
  const res = await fetch(`${OMNICLAW_API_URL}${path}`, {
    method: "POST",
    headers: headers(),
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  })
  return parseResponse(res)
}

export function toProxySuccess<T>(data: T): ProxyResult<T> {
  return { success: true, data, timestamp: timestamp() }
}

export function toProxyError(error: unknown): ProxyResult {
  return { success: false, error: String(error), timestamp: timestamp() }
}

export async function getHealth() {
  const res = await fetch(`${OMNICLAW_API_URL}/api/v1/health`, {
    method: "GET",
    cache: "no-store",
  })
  return parseResponse(res)
}

export const getWallets = () => getOmniClaw("/api/v1/wallets")

export const getAddress = () => getOmniClaw("/api/v1/address")

export const getBalanceDetail = () => getOmniClaw("/api/v1/balance-detail")

export const getTransactions = (limit = 50) =>
  getOmniClaw(`/api/v1/transactions?limit=${encodeURIComponent(String(limit))}`)

export const deposit = (amount: string) =>
  postOmniClaw(
    `/api/v1/deposit?amount=${encodeURIComponent(
      amount
    )}&check_gas=false&skip_if_insufficient_gas=true`
  )

export const withdraw = (amount: string) =>
  postOmniClaw(`/api/v1/withdraw?amount=${encodeURIComponent(amount)}`)

export const inspect = (template: ApiTemplate) =>
  postOmniClaw("/api/v1/x402/inspect", {
    url: template.url,
    method: template.method,
    body: template.body,
    headers: template.headers,
  })

export const pay = (template: ApiTemplate, idempotencyKey: string) =>
  postOmniClaw("/api/v1/pay", {
    recipient: template.url,
    method: template.method,
    body: template.body,
    headers: template.headers,
    idempotency_key: idempotencyKey,
  })
