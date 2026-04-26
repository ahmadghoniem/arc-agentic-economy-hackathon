import type { AgentPlan } from "@/lib/agent/types"

export type ProviderOption = "auto" | "gemini" | "featherless" | "aivml"

export type ModelEntry = {
  provider: "gemini" | "featherless" | "aivml"
  id: string
  label: string
  enabled: boolean
  requiresEnv: string
}

export type ModelGroup = {
  provider: "gemini" | "featherless" | "aivml"
  models: ModelEntry[]
}

const REQUEST_TIMEOUT_MS = 45_000

async function request<T>(path: string, body?: Record<string, unknown>): Promise<T> {
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

    const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>
    if (!response.ok) {
      return {
        ok: false,
        error: String(payload?.error || `Request failed (${response.status})`),
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

export function getAgentModels() {
  return request<{ ok: boolean; groups: ModelGroup[] }>("/api/agent/models")
}

export function getAgentPlan(input: {
  provider: ProviderOption
  model: string
  prompt: string
  endpointFocus?: string
}) {
  return request<AgentPlan>("/api/agent/plan", input)
}

export function executeAgentPlan(input: { plan: AgentPlan; confirmed: boolean }) {
  return request<{
    ok: boolean
    error?: string
    steps?: Array<Record<string, unknown>>
    totalPaidUSDC?: string
    finalContext?: Record<string, unknown>
  }>("/api/agent/execute-plan", input)
}

export function getFinalAnswer(input: {
  provider: AgentPlan["provider"]
  model: string
  originalPrompt: string
  executedSteps: Array<Record<string, unknown>>
}) {
  return request<{ ok: boolean; provider: string; answer: string; error?: string }>(
    "/api/agent/final-answer",
    input
  )
}

export function getAgentPreamble(input: {
  provider: ProviderOption
  model: string
  prompt: string
}) {
  return request<{ ok: boolean; provider?: string; text?: string; error?: string }>(
    "/api/agent/preamble",
    input
  )
}

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
    const fallback = await getFinalAnswer(input)
    yield fallback.answer || "Unable to generate final answer."
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) {
        yield decoder.decode(value, { stream: true })
      }
    }
  } finally {
    reader.releaseLock()
  }
}
