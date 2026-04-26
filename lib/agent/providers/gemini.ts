import type { ProviderAnswerResult, ProviderCallResult, ProviderPlanResult } from "@/lib/agent/providers/types"

function extractJson(text: string): ProviderPlanResult | null {
  const cleaned = text.trim()
  const direct = safeJson(cleaned)
  if (direct) return direct

  const start = cleaned.indexOf("{")
  const end = cleaned.lastIndexOf("}")
  if (start >= 0 && end > start) {
    return safeJson(cleaned.slice(start, end + 1))
  }

  return null
}

function safeJson(value: string): ProviderPlanResult | null {
  try {
    return JSON.parse(value) as ProviderPlanResult
  } catch {
    return null
  }
}

export async function geminiPlan(input: {
  model: string
  prompt: string
  availableTools: Array<{ id: string; name: string; endpoint: string; priceUSDC: string | null; aliases: string[] }>
}): Promise<ProviderCallResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return { ok: false, provider: "gemini", error: "GEMINI_API_KEY is missing" }
  }

  const model = input.model || process.env.GEMINI_MODEL || "gemini-2.5-flash"

  const instruction = [
    "You are an API planner for paid API tools.",
    "Return JSON only.",
    "Do not create payment intents.",
    "Do not execute payments.",
    "Choose only from availableTools.",
    "IMPORTANT: You MUST always select at least one tool. If no specific tool matches, use 'general_assistant' as a catch-all.",
    "For shopping/purchase/buy intents, ALWAYS use 'product_discovery'.",
    "Output schema:",
    '{"summary":"string","steps":[{"toolId":"string","reason":"string","input":{}}],"message":"string"}',
    `User prompt: ${input.prompt}`,
    `availableTools: ${JSON.stringify(input.availableTools)}`,
  ].join("\n")

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: instruction }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        }),
      }
    )

    if (!response.ok) {
      return { ok: false, provider: "gemini", error: `Gemini request failed (${response.status})` }
    }

    const payload = (await response.json()) as Record<string, unknown>
    const text =
      ((payload.candidates as Array<Record<string, unknown>> | undefined)?.[0]?.content as Record<string, unknown> | undefined)
        ?.parts as Array<Record<string, unknown>> | undefined
    const outputText = String(text?.[0]?.text || "")

    const parsed = extractJson(outputText)
    if (!parsed) {
      return { ok: false, provider: "gemini", error: "Gemini returned invalid JSON plan" }
    }

    return { ok: true, provider: "gemini", data: parsed }
  } catch (error) {
    return {
      ok: false,
      provider: "gemini",
      error: error instanceof Error ? error.message : "Gemini call failed",
    }
  }
}

export async function geminiSummarize(input: {
  model: string
  originalPrompt: string
  executedSteps: unknown
}): Promise<ProviderAnswerResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return { ok: false, error: "GEMINI_API_KEY is missing" }
  }

  const model = input.model || process.env.GEMINI_MODEL || "gemini-2.5-flash"
  const prompt = [
    "Summarize final user answer using executed paid API responses.",
    "Do not claim payments were executed by AI. OmniClaw handles payments.",
    `Original prompt: ${input.originalPrompt}`,
    `Executed steps: ${JSON.stringify(input.executedSteps)}`,
  ].join("\n")

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2 },
        }),
      }
    )

    if (!response.ok) {
      return { ok: false, error: `Gemini summary failed (${response.status})` }
    }

    const payload = (await response.json()) as Record<string, unknown>
    const text =
      ((((payload.candidates as Array<Record<string, unknown>> | undefined)?.[0]?.content as Record<string, unknown> | undefined)
        ?.parts as Array<Record<string, unknown>> | undefined)?.[0]?.text as string | undefined) || ""

    return { ok: true, text: text.trim() }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Gemini summary failed" }
  }
}

export async function geminiPreamble(input: {
  model: string
  prompt: string
}): Promise<ProviderAnswerResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return { ok: false, error: "GEMINI_API_KEY is missing" }
  }

  const model = input.model || process.env.GEMINI_MODEL || "gemini-2.5-flash"
  const prompt = [
    "Write one short friendly acknowledgement to the user.",
    "Do not mention payment execution.",
    "Keep it under 20 words.",
    `User prompt: ${input.prompt}`,
  ].join("\n")

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2 },
        }),
      }
    )

    if (!response.ok) {
      return { ok: false, error: `Gemini preamble failed (${response.status})` }
    }

    const payload = (await response.json()) as Record<string, unknown>
    const text =
      ((((payload.candidates as Array<Record<string, unknown>> | undefined)?.[0]?.content as Record<string, unknown> | undefined)
        ?.parts as Array<Record<string, unknown>> | undefined)?.[0]?.text as string | undefined) || ""

    return { ok: true, text: text.trim() }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Gemini preamble failed" }
  }
}
