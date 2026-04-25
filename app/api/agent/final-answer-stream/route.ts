/**
 * /api/agent/final-answer-stream
 *
 * Returns the final answer as a streamed plain-text response.
 *
 * Strategy: use the same non-streaming featherlessSummarize() that the
 * preamble uses (via openAICompatChat) — it's proven to work. Once we have
 * the full text we emit it as a single chunk so the client still gets a
 * ReadableStream and the existing streaming consumer in use-demo-runner works
 * without any changes.
 *
 * Gemini is kept as a secondary fallback if Featherless fails.
 */
export const runtime = "nodejs"

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

  const model = body.model ?? ""
  const originalPrompt = String(body.originalPrompt ?? "")
  const executedSteps = Array.isArray(body.executedSteps)
    ? body.executedSteps
    : []

  if (!originalPrompt) {
    return new Response("originalPrompt is required", { status: 400 })
  }

  // Resolve a single Featherless model ID — never read FEATHERLESS_MODEL from
  // env here, that var holds a comma-separated list for the registry dropdown.
  const featherlessModel =
    model && !model.startsWith("gemini-") ? model : "Qwen/Qwen3-8B"

  console.log(
    `[final-answer-stream] model="${model}" → featherlessModel="${featherlessModel}"`
  )

  // ── Try Featherless (same path as preamble — proven to work) ──────────────
  const featherlessResult = await featherlessSummarize({
    model: featherlessModel,
    originalPrompt,
    executedSteps,
  }).catch((err) => {
    console.error("[final-answer-stream] featherlessSummarize threw:", err)
    return { ok: false as const, error: String(err) }
  })

  if (featherlessResult.ok && featherlessResult.text) {
    console.log("[final-answer-stream] Featherless succeeded")
    return new Response(textStream(featherlessResult.text), {
      headers: RESPONSE_HEADERS,
    })
  }
  console.error(
    "[final-answer-stream] Featherless failed:",
    featherlessResult.error
  )

  // ── Gemini fallback ───────────────────────────────────────────────────────
  const geminiResult = await geminiSummarize({
    model: "gemini-2.0-flash-lite",
    originalPrompt,
    executedSteps,
  }).catch((err) => {
    console.error("[final-answer-stream] geminiSummarize threw:", err)
    return { ok: false as const, error: String(err) }
  })

  if (geminiResult.ok && geminiResult.text) {
    console.log("[final-answer-stream] Gemini fallback succeeded")
    return new Response(textStream(geminiResult.text), {
      headers: RESPONSE_HEADERS,
    })
  }
  console.error(
    "[final-answer-stream] Gemini fallback failed:",
    geminiResult.error
  )

  // ── Last resort ───────────────────────────────────────────────────────────
  const fallbackText =
    executedSteps.length > 0
      ? "I retrieved data for your request but couldn't format it with the AI model right now. Please try again."
      : "No data was returned for your request."

  return new Response(textStream(fallbackText), { headers: RESPONSE_HEADERS })
}
