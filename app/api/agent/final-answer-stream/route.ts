/**
 * /api/agent/final-answer-stream
 *
 * Returns the final answer as a streamed plain-text response. Featherless is
 * the only AI provider; provider failures return a deterministic text fallback.
 */
export const runtime = "nodejs"

import { featherlessSummarize } from "@/lib/agent/providers/featherless"

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

  const featherlessModel = model || "Qwen/Qwen3-8B"

  const featherlessResult = await featherlessSummarize({
    model: featherlessModel,
    originalPrompt,
    executedSteps,
  }).catch((err) => {
    console.error("[final-answer-stream] featherlessSummarize threw:", err)
    return { ok: false as const, error: String(err) }
  })

  if (featherlessResult.ok && featherlessResult.text) {
    return new Response(textStream(featherlessResult.text), {
      headers: RESPONSE_HEADERS,
    })
  }
  console.error(
    "[final-answer-stream] Featherless failed:",
    featherlessResult.error
  )

  const fallbackText =
    executedSteps.length > 0
      ? "I retrieved data for your request but couldn't format it with Featherless right now. Please try again."
      : "No data was returned for your request."

  return new Response(textStream(fallbackText), { headers: RESPONSE_HEADERS })
}
