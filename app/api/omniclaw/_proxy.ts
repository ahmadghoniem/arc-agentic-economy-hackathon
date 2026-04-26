import { NextResponse } from "next/server"

const BACKEND_URL = process.env.OMNICLAW_BACKEND_URL || "http://localhost:8090"
const REQUEST_TIMEOUT_MS = 30_000

export type ProxyBody = Record<string, unknown> | null

function toErrorMessage(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim()) {
    return value
  }
  if (Array.isArray(value)) {
    const joined = value
      .map((item) => toErrorMessage(item, ""))
      .filter(Boolean)
      .join("; ")
    return joined || fallback
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>
    if (typeof obj.message === "string" && obj.message.trim()) {
      return obj.message
    }
    if (typeof obj.msg === "string" && obj.msg.trim()) {
      return obj.msg
    }
    if (obj.loc || obj.type) {
      const loc = Array.isArray(obj.loc) ? obj.loc.join(".") : String(obj.loc || "")
      const msg =
        typeof obj.msg === "string"
          ? obj.msg
          : typeof obj.message === "string"
            ? obj.message
            : JSON.stringify(obj)
      return loc ? `${loc}: ${msg}` : msg
    }
    try {
      return JSON.stringify(obj)
    } catch {
      return fallback
    }
  }
  return fallback
}

export async function proxyToBackend(
  path: string,
  method: "GET" | "POST",
  body?: ProxyBody
) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${BACKEND_URL}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: method === "POST" ? JSON.stringify(body ?? {}) : undefined,
      signal: controller.signal,
      cache: "no-store",
    })

    const payload = await response
      .json()
      .catch(() => ({ ok: false, error: "Invalid backend JSON", data: {} }))

    if (!response.ok) {
      const proxyError = toErrorMessage(
        payload?.error ?? payload?.detail,
        `Backend error (${response.status})`
      )
      return NextResponse.json(
        {
          ok: false,
          unavailable: false,
          blocked: false,
          error: proxyError,
          data: payload?.data || {},
        },
        { status: response.status }
      )
    }

    return NextResponse.json(payload)
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? "Backend request timed out"
        : error instanceof Error
          ? error.message
          : "Backend request failed"

    return NextResponse.json(
      {
        ok: false,
        unavailable: true,
        blocked: false,
        error: message,
        data: {},
      },
      { status: 503 }
    )
  } finally {
    clearTimeout(timeout)
  }
}
