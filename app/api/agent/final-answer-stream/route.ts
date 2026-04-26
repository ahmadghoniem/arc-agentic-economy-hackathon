export const runtime = "nodejs"

import { aivmlSummarize } from "@/lib/agent/providers/aivml"
import { featherlessSummarize } from "@/lib/agent/providers/featherless"
import { geminiSummarize } from "@/lib/agent/providers/gemini"

type ExecutedStep = Record<string, unknown>

function textStream(text: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(text))
      controller.close()
    },
  })
}

const RESPONSE_HEADERS = {
  "Content-Type": "text/plain; charset=utf-8",
  "Cache-Control": "no-store, no-transform",
  "X-Accel-Buffering": "no",
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "N/A"
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "object" && item !== null ? JSON.stringify(item) : String(item)))
      .join(", ")
  }
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}

function deterministicSummary(originalPrompt: string, executedSteps: ExecutedStep[]) {
  const parts: string[] = []
  for (const step of executedSteps) {
    const toolId = String(step.toolId || "api_call")
    const response = (step.response as Record<string, unknown> | undefined) || {}
    const data = (response.data as Record<string, unknown> | undefined) || {}
    const entries = Object.entries(data).filter(([k]) => k !== "localPaidApiDemo")
    if (!entries.length) continue

    const formatted = entries
      .map(([key, val]) => `${key}: ${formatValue(val)}`)
      .join("\n")
    parts.push(`${toolId}\n${formatted}`)
  }

  if (!parts.length) {
    return `I completed the approved API workflow for: "${originalPrompt}".`
  }

  return `Result for "${originalPrompt}":\n\n${parts.join("\n\n")}`
}

async function summarizeWithProvider(input: {
  provider: string
  model: string
  originalPrompt: string
  executedSteps: ExecutedStep[]
}) {
  const { provider, model, originalPrompt, executedSteps } = input

  if (provider === "gemini") {
    const r = await geminiSummarize({ model, originalPrompt, executedSteps })
    if (r.ok && r.text) return r.text
  }
  if (provider === "featherless") {
    const r = await featherlessSummarize({ model, originalPrompt, executedSteps })
    if (r.ok && r.text) return r.text
  }
  if (provider === "aivml") {
    const r = await aivmlSummarize({ model, originalPrompt, executedSteps })
    if (r.ok && r.text) return r.text
  }

  // Auto fallback order: provider inferred by model first, then others.
  const lower = model.toLowerCase()
  const inferred =
    model.startsWith("gemini-")
      ? "gemini"
      : lower.includes("gpt-") || lower.includes("mistral-") || lower.includes("claude-")
        ? "aivml"
        : "featherless"

  for (const candidate of [inferred, "gemini", "featherless", "aivml"]) {
    if (candidate === "gemini") {
      const r = await geminiSummarize({ model, originalPrompt, executedSteps })
      if (r.ok && r.text) return r.text
    }
    if (candidate === "featherless") {
      const r = await featherlessSummarize({ model, originalPrompt, executedSteps })
      if (r.ok && r.text) return r.text
    }
    if (candidate === "aivml") {
      const r = await aivmlSummarize({ model, originalPrompt, executedSteps })
      if (r.ok && r.text) return r.text
    }
  }

  return deterministicSummary(originalPrompt, executedSteps)
}

export async function POST(request: Request) {
  let body: {
    provider?: string
    model?: string
    originalPrompt?: string
    executedSteps?: ExecutedStep[]
  }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return new Response("Invalid JSON body", { status: 400 })
  }

  const provider = String(body.provider || "auto")
  const model = String(body.model || "")
  const originalPrompt = String(body.originalPrompt || "")
  const executedSteps = Array.isArray(body.executedSteps) ? body.executedSteps : []

  if (!originalPrompt) {
    return new Response("originalPrompt is required", { status: 400 })
  }

  const answer = await summarizeWithProvider({
    provider,
    model,
    originalPrompt,
    executedSteps,
  })

  return new Response(textStream(answer), { headers: RESPONSE_HEADERS })
}

