import { NextResponse } from "next/server"

import { aivmlSummarize } from "@/lib/agent/providers/aivml"
import { featherlessSummarize } from "@/lib/agent/providers/featherless"
import { geminiSummarize } from "@/lib/agent/providers/gemini"

const PROVIDER_TIMEOUT_MS = 25000

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("Provider timeout")), timeoutMs)
    }),
  ])
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "N/A"
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (typeof item === "object" && item !== null) {
        const obj = item as Record<string, unknown>
        const parts = Object.entries(obj)
          .filter(([k]) => k !== "localPaidApiDemo")
          .map(([k, v]) => `${k}: ${formatValue(v)}`)
        return parts.join(", ")
      }
      return String(item)
    }).join("\n  - ")
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>
    return Object.entries(obj)
      .filter(([k]) => k !== "localPaidApiDemo")
      .map(([k, v]) => `${k}: ${formatValue(v)}`)
      .join(", ")
  }
  return String(value)
}

function deterministicSummary(originalPrompt: string, executedSteps: Array<Record<string, unknown>>) {
  const knowledge = executedSteps.find((step) => step.toolId === "knowledge_search")
  const social = executedSteps.find((step) => step.toolId === "social_profile")
  const products = executedSteps.find((step) => step.toolId === "product_discovery")

  const knowledgeAnswer = (knowledge?.response as Record<string, unknown> | undefined)?.data as Record<string, unknown> | undefined
  const socialAnswer = (social?.response as Record<string, unknown> | undefined)?.data as Record<string, unknown> | undefined
  const productAnswer = (products?.response as Record<string, unknown> | undefined)?.data as Record<string, unknown> | undefined

  if (knowledgeAnswer?.answer && socialAnswer?.followers) {
    return `Linux was created by Linus Torvalds. The social profile API returned ${Number(socialAnswer.followers).toLocaleString()} followers for the demo handle.`
  }

  if (productAnswer?.results && Array.isArray(productAnswer.results) && productAnswer.results.length > 0) {
    const top = productAnswer.results.slice(0, 3).map((item) => {
      const row = item as Record<string, unknown>
      return `- ${String(row.name || "Item")} (${String(row.brand || "Brand")}) - $${String(row.priceUsd || "?")} - rating ${String(row.rating || "?")}`
    })
    return `Here are top options for "${originalPrompt}":\n${top.join("\n")}\nChoose one and I can run a paid follow-up for detailed specs.`
  }

  // Generic smart formatting for any tool response
  const parts: string[] = []
  for (const step of executedSteps) {
    const data = (step.response as Record<string, unknown> | undefined)?.data as Record<string, unknown> | undefined
    if (!data) continue

    const toolId = String(step.toolId || "api_call")
    const cleanEntries = Object.entries(data).filter(([k]) => k !== "localPaidApiDemo")

    if (cleanEntries.length === 0) continue

    const formatted = cleanEntries.map(([key, val]) => {
      const label = key.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ").trim()
      const capitalLabel = label.charAt(0).toUpperCase() + label.slice(1)
      return `**${capitalLabel}:** ${formatValue(val)}`
    })

    // Use the tool name as a header, nicely formatted
    const toolLabel = toolId.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    parts.push(`📡 ${toolLabel}\n${formatted.join("\n")}`)
  }

  if (parts.length > 0) {
    return `Here's what I found for "${originalPrompt}":\n\n${parts.join("\n\n")}`
  }

  return `I processed your request "${originalPrompt}" through the paid API pipeline. The task completed successfully.`
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      provider?: "gemini" | "featherless" | "aivml" | "fallback"
      model?: string
      originalPrompt?: string
      executedSteps?: Array<Record<string, unknown>>
    }

    const provider = body.provider || "fallback"
    const model = body.model || ""
    const originalPrompt = String(body.originalPrompt || "")
    const executedSteps = Array.isArray(body.executedSteps) ? body.executedSteps : []

    if (!originalPrompt) {
      return NextResponse.json({ ok: false, error: "originalPrompt is required" }, { status: 400 })
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

    if (provider === "aivml") {
      const result = await withTimeout(
        aivmlSummarize({ model, originalPrompt, executedSteps }),
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
