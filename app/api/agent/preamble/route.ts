/**
 * /api/agent/preamble
 *
 * Returns a single short, confidence-instilling acknowledgement of the user's
 * prompt before the planner runs. Failures are non-fatal — the UI just won't
 * show a preamble.
 */
import { NextResponse } from "next/server"

import { featherlessPreamble } from "@/lib/agent/providers/featherless"
import { geminiPreamble } from "@/lib/agent/providers/gemini"

const PROVIDER_TIMEOUT_MS = 8_000

const FALLBACK_TEXT =
  "On it — let me find the right endpoints and put a plan together."

/**
 * Race a promise against a timeout. On timeout we resolve with `null` rather
 * than rejecting, so the caller can fall through to the deterministic
 * preamble without bubbling a 500 to the client.
 */
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
      provider?: "gemini" | "featherless" | "auto" | "fallback"
      model?: string
      prompt?: string
    }

    const provider = body.provider || "auto"
    const model = body.model || ""
    const prompt = String(body.prompt || "")

    if (!prompt) {
      return NextResponse.json(
        { ok: false, error: "prompt is required" },
        { status: 400 }
      )
    }

    // Always try featherless first for the preamble — it's a paid endpoint
    // with no rate-limit contention and responds faster than Gemini free tier.
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

    // Gemini as secondary fallback.
    if (provider === "gemini") {
      const result = await withTimeout(
        geminiPreamble({ model, prompt }).catch((err) => {
          console.error("[preamble] geminiPreamble threw:", err)
          return null
        }),
        PROVIDER_TIMEOUT_MS
      )
      if (result?.ok && result.text) {
        return NextResponse.json({ ok: true, provider, text: result.text })
      }
      console.error("[preamble] Gemini result:", result)
    }

    // Fallback: deterministic, friendly default — never blocks the flow.
    return NextResponse.json({
      ok: true,
      provider: "fallback",
      text: FALLBACK_TEXT,
    })
  } catch {
    // Any unexpected error still returns a usable fallback rather than 500
    // — the preamble is purely cosmetic and shouldn't break the chat UX.
    return NextResponse.json({
      ok: true,
      provider: "fallback",
      text: FALLBACK_TEXT,
    })
  }
}
