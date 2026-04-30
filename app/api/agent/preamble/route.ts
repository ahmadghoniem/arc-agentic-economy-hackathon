/**
 * /api/agent/preamble
 *
 * Returns a single short acknowledgement of the user's prompt before the
 * planner runs. Featherless is the only AI provider; failures fall back to a
 * deterministic message so the chat flow is never blocked.
 */
import { NextResponse } from "next/server"

import { featherlessPreamble } from "@/lib/agent/providers/featherless"

const PROVIDER_TIMEOUT_MS = 8_000

const FALLBACK_TEXT =
  "On it - let me find the right endpoints and put a plan together."

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), timeoutMs)
    }),
  ])
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      provider?: "featherless" | "auto" | "fallback"
      model?: string
      prompt?: string
    }

    const model = body.model || ""
    const prompt = String(body.prompt || "")

    if (!prompt) {
      return NextResponse.json(
        { ok: false, error: "prompt is required" },
        { status: 400 }
      )
    }

    const featherlessResult = await withTimeout(
      featherlessPreamble({ model, prompt }).catch((err) => {
        console.error("[preamble] featherlessPreamble threw:", err)
        return null
      }),
      PROVIDER_TIMEOUT_MS
    )
    if (featherlessResult?.ok && featherlessResult.text) {
      return NextResponse.json({
        ok: true,
        provider: "featherless",
        text: featherlessResult.text,
      })
    }
    console.error("[preamble] Featherless result:", featherlessResult)

    return NextResponse.json({
      ok: true,
      provider: "fallback",
      text: FALLBACK_TEXT,
    })
  } catch {
    return NextResponse.json({
      ok: true,
      provider: "fallback",
      text: FALLBACK_TEXT,
    })
  }
}
