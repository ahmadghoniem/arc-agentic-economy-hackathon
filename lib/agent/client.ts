import type { AgentPlan } from "@/lib/agent/types"
import type { ProviderId } from "@/lib/agent/model-registry"

export type ProviderOption = "auto" | ProviderId

const REQUEST_TIMEOUT_MS = 45_000

async function request<T>(
  path: string,
  body?: Record<string, unknown>
): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(path, {
      method: body ? "POST" : "GET",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
      signal: controller.signal,
    })

    const payload = (await response.json().catch(() => ({}))) as Record<
      string,
      unknown
    >
    if (!response.ok) {
      return {
        ok: false,
        error: String(payload.error || `Request failed (${response.status})`),
      } as T
    }
    return payload as T
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error && error.name === "AbortError"
          ? "Request timed out"
          : error instanceof Error
            ? error.message
            : "Request failed",
    } as T
  } finally {
    clearTimeout(timeout)
  }
}

export function getAgentPlan(input: {
  provider: ProviderOption
  model: string
  prompt: string
  endpointFocus: string
}) {
  return request<AgentPlan>("/api/agent/plan", input)
}

export function getAgentPreamble(input: {
  provider: ProviderOption
  model: string
  prompt: string
}) {
  return request<{
    ok: boolean
    provider: string
    text: string
    error?: string
  }>("/api/agent/preamble", input)
}

export function executeAgentPlan(input: {
  plan: AgentPlan
  confirmed: boolean
}) {
  return request<{
    ok: boolean
    error?: string
    steps?: Array<Record<string, unknown>>
    totalPaidUSDC?: string
  }>("/api/agent/execute-plan", input)
}

/**
 * Streams the final answer as plain text chunks. Yields each chunk as it
 * arrives so the UI can append tokens to a chat bubble in real time.
 *
 * The route always returns *something* readable — even on provider failure
 * it falls back to a deterministic summary — so the caller can simply
 * concatenate every chunk it receives.
 */
export async function* getFinalAnswerStream(input: {
  provider: AgentPlan["provider"]
  model: string
  originalPrompt: string
  executedSteps: Array<Record<string, unknown>>
}): AsyncGenerator<string, void, unknown> {
  const response = await fetch("/api/agent/final-answer-stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    cache: "no-store",
  })

  if (!response.ok || !response.body) {
    throw new Error(`Final answer stream failed (${response.status})`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    const text = decoder.decode(value, { stream: true })
    if (text) yield text
  }
}
