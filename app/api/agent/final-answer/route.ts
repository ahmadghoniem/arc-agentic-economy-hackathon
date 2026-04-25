import { NextResponse } from "next/server"

import { featherlessSummarize } from "@/lib/agent/providers/featherless"
import { geminiSummarize } from "@/lib/agent/providers/gemini"

const PROVIDER_TIMEOUT_MS = 12_000

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("Provider timeout")), timeoutMs)
    }),
  ])
}

function safeSnippet(data: unknown): string {
  if (data === null || data === undefined) return "no data returned"
  const json = JSON.stringify(data)
  if (json.length <= 800) return json
  return json.slice(0, 800) + "…"
}

function deterministicSummary(
  originalPrompt: string,
  executedSteps: Array<Record<string, unknown>>
) {
  if (executedSteps.length === 0) {
    return `I ran your request — "${originalPrompt}" — but no API calls returned data.`
  }
  const lines = executedSteps.map((step) => {
    const apiId = String(step.apiId || step.toolId || "API")
    const response = step.response as Record<string, unknown> | undefined
    return `- **${apiId}**: ${safeSnippet(response?.data)}`
  })
  return [`Here's what I found for: _${originalPrompt}_`, "", ...lines].join(
    "\n"
  )
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      provider?: "gemini" | "featherless" | "fallback"
      model?: string
      originalPrompt?: string
      executedSteps?: Array<Record<string, unknown>>
    }

    const provider = body.provider || "fallback"
    const model = body.model || ""
    const originalPrompt = String(body.originalPrompt || "")
    const executedSteps = Array.isArray(body.executedSteps)
      ? body.executedSteps
      : []

    if (!originalPrompt) {
      return NextResponse.json(
        { ok: false, error: "originalPrompt is required" },
        { status: 400 }
      )
    }

    if (provider === "gemini") {
      const result = await withTimeout(
        geminiSummarize({ model, originalPrompt, executedSteps }),
        PROVIDER_TIMEOUT_MS
      )
      if (result.ok && result.text) {
        return NextResponse.json({ ok: true, provider, answer: result.text })
      }
    }

    if (provider === "featherless") {
      const result = await withTimeout(
        featherlessSummarize({ model, originalPrompt, executedSteps }),
        PROVIDER_TIMEOUT_MS
      )
      if (result.ok && result.text) {
        return NextResponse.json({ ok: true, provider, answer: result.text })
      }
    }

    return NextResponse.json({
      ok: true,
      provider: "fallback",
      answer: deterministicSummary(originalPrompt, executedSteps),
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Final answer failed",
      },
      { status: 500 }
    )
  }
}
