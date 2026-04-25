import type {
  ProviderAnswerResult,
  ProviderCallResult,
  ProviderPlanResult,
} from "@/lib/agent/providers/types"

function parsePlan(text: string): ProviderPlanResult | null {
  try {
    return JSON.parse(text) as ProviderPlanResult
  } catch {
    const start = text.indexOf("{")
    const end = text.lastIndexOf("}")
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1)) as ProviderPlanResult
      } catch {
        return null
      }
    }
    return null
  }
}

async function openAICompatChat(input: {
  baseUrl: string
  apiKey: string
  model: string
  prompt: string
  responseFormatJson?: boolean
}) {
  const response = await fetch(
    `${input.baseUrl.replace(/\/$/, "")}/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${input.apiKey}`,
      },
      body: JSON.stringify({
        model: input.model,
        temperature: 0.1,
        response_format: input.responseFormatJson
          ? { type: "json_object" }
          : undefined,
        messages: [
          {
            role: "system",
            content:
              "You are a precise planner. Never execute payment. Return concise output.",
          },
          { role: "user", content: input.prompt },
        ],
      }),
    }
  )

  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`)
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  return String(payload.choices?.[0]?.message?.content || "")
}

export async function featherlessPlan(input: {
  model: string
  prompt: string
  availableTools: Array<{
    id: string
    name: string
    endpoint: string
    priceUSDC: string | null
    aliases: string[]
  }>
}): Promise<ProviderCallResult> {
  const apiKey = process.env.FEATHERLESS_API_KEY
  if (!apiKey) {
    return {
      ok: false,
      provider: "featherless",
      error: "FEATHERLESS_API_KEY is missing",
    }
  }

  const model = input.model || process.env.FEATHERLESS_MODEL || "qwen3.5-plus"
  const baseUrl = process.env.FEATHERLESS_BASE_URL || "https://api.featherless.ai/v1"
  const prompt = [
    "Return JSON only.",
    "Choose only from availableTools.",
    "Do not create payment intents.",
    "Do not execute payments.",
    '{"summary":"string","steps":[{"toolId":"string","reason":"string","input":{}}],"message":"string"}',
    `User prompt: ${input.prompt}`,
    `availableTools: ${JSON.stringify(input.availableTools)}`,
  ].join("\n")

  try {
    const content = await openAICompatChat({
      baseUrl,
      apiKey,
      model,
      prompt,
      responseFormatJson: true,
    })
    const parsed = parsePlan(content)
    if (!parsed) {
      return {
        ok: false,
        provider: "featherless",
        error: "Featherless returned invalid JSON plan",
      }
    }
    return { ok: true, provider: "featherless", data: parsed }
  } catch (error) {
    return {
      ok: false,
      provider: "featherless",
      error: error instanceof Error ? error.message : "Featherless call failed",
    }
  }
}

export async function featherlessSummarize(input: {
  model: string
  originalPrompt: string
  executedSteps: unknown
}): Promise<ProviderAnswerResult> {
  const apiKey = process.env.FEATHERLESS_API_KEY
  if (!apiKey) {
    return { ok: false, error: "FEATHERLESS_API_KEY is missing" }
  }

  const model = input.model || process.env.FEATHERLESS_MODEL || "qwen3.5-plus"
  const baseUrl = process.env.FEATHERLESS_BASE_URL || "https://api.featherless.ai/v1"
  const prompt = [
    "Provide final user-facing answer from executed API responses.",
    "Do not claim AI executed payments.",
    `Original prompt: ${input.originalPrompt}`,
    `Executed steps: ${JSON.stringify(input.executedSteps)}`,
  ].join("\n")

  try {
    const content = await openAICompatChat({ baseUrl, apiKey, model, prompt })
    return { ok: true, text: content.trim() }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Featherless summary failed",
    }
  }
}
