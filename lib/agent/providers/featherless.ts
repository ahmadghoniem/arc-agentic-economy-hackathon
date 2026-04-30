import type {
  ProviderAnswerResult,
  ProviderCallResult,
  ProviderPlanResult,
} from "@/lib/agent/providers/types"

type ToolParam = {
  name: string
  required: boolean
  type: string
  description: string
  example?: unknown
}

type AvailableTool = {
  id: string
  skill: string
  name: string
  description: string
  path: string
  method: string
  priceUSDC: string
  params: ToolParam[]
}

function slimSteps(executedSteps: unknown): unknown {
  if (!Array.isArray(executedSteps)) return executedSteps
  return executedSteps.map((step: Record<string, unknown>) => ({
    apiId: step.apiId ?? step.toolId,
    result: (step.response as Record<string, unknown> | undefined)?.data,
  }))
}

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
  systemPrompt?: string
  responseFormatJson?: boolean
  tag?: string
}) {
  const tag = input.tag ?? "openAICompatChat"

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
              input.systemPrompt ??
              "You are a precise planner. Return concise output only.",
          },
          { role: "user", content: input.prompt },
        ],
      }),
    }
  )

  if (!response.ok) {
    const errBody = await response.text().catch(() => "(unreadable)")
    console.error(`[${tag}] HTTP ${response.status}: ${errBody}`)
    throw new Error(`Request failed (${response.status}): ${errBody}`)
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const content = String(payload.choices?.[0]?.message?.content || "")
  return content
}

export async function featherlessPlan(input: {
  model: string
  prompt: string
  availableTools: AvailableTool[]
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
  const baseUrl =
    process.env.FEATHERLESS_BASE_URL || "https://api.featherless.ai/v1"

  const systemPrompt = [
    "You are an API routing planner. Select the correct tool and populate its parameters from the user prompt.",
    "Return JSON only. No markdown.",
    "",
    "CRITICAL RULES:",
    "1. Choose the tool whose `description` and `path` best matches the user's intent.",
    "   - Tweets/posts/timeline ? use tweets tool, NOT profile tool.",
    "   - Trending topics ? use trends tool.",
    "2. Build `input` using the `params` schema. Every required=true param MUST be included.",
    "   Use each param's `description` and `example` to know what value to supply.",
    "3. COINGECKO IDs: `ids` must use CoinGecko slug names, NOT ticker symbols.",
    "   WRONG: 'btc','eth','sol','xrp'. RIGHT: 'bitcoin','ethereum','solana','ripple'.",
    "   Map: btc?bitcoin, eth?ethereum, sol?solana, xrp?ripple, doge?dogecoin, ada?cardano,",
    "        bnb?binancecoin, avax?avalanche-2, dot?polkadot, matic?matic-network.",
    "4. TWITTER usernames: strip @. '@elonmusk' ? 'elonmusk'.",
    "5. TWITTER woeid: default '1' (worldwide) unless location specified.",
    "6. YOUTUBE engine: always 'youtube'.",
    "7. PERPLEXITY messages: always [{\"role\":\"user\",\"content\":\"<user question>\"}].",
    "8. STOCK period: must be exactly 'annual', 'quarterly', or 'ttm'.",
    "9. Never create payment intents. Never execute payments. Planning only.",
    "",
    'Output schema: {"summary":"string","message":"string","steps":[{"toolId":"string","reason":"string","input":{}}]}',
  ].join("\n")

  const userPrompt = [
    `User prompt: ${input.prompt}`,
    `Available tools: ${JSON.stringify(input.availableTools)}`,
  ].join("\n")

  try {
    const content = await openAICompatChat({
      baseUrl,
      apiKey,
      model,
      systemPrompt,
      prompt: userPrompt,
      responseFormatJson: true,
      tag: "featherlessPlan",
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

export async function featherlessPreamble(input: {
  model: string
  prompt: string
}): Promise<ProviderAnswerResult> {
  const apiKey = process.env.FEATHERLESS_API_KEY
  if (!apiKey) return { ok: false, error: "FEATHERLESS_API_KEY is missing" }

  const model = input.model || process.env.FEATHERLESS_MODEL || "qwen3.5-plus"
  const baseUrl =
    process.env.FEATHERLESS_BASE_URL || "https://api.featherless.ai/v1"
  const systemPrompt = [
    "You're an AI shopping agent that pays for API endpoints on the user's behalf.",
    "Acknowledge the user's request in ONE short sentence (max 18 words).",
    "Be confident and friendly. Tell them what you'll do next, in plain language.",
    "Do NOT list endpoints. Do NOT mention payments, USDC, or x402.",
    "Do NOT ask questions. Do NOT add quotes around your reply.",
  ].join("\n")
  const prompt = `User prompt: ${input.prompt}`

  try {
    const content = await openAICompatChat({
      baseUrl,
      apiKey,
      model,
      systemPrompt,
      prompt,
      tag: "featherlessPreamble",
    })
    return { ok: true, text: content.trim().replace(/^["']|["']$/g, "") }
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Featherless preamble failed",
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

  // Never use FEATHERLESS_MODEL env var here — it's a comma-separated list
  // for the model registry, not a single model ID.
  const model = input.model || "Qwen/Qwen3-8B"
  const baseUrl =
    process.env.FEATHERLESS_BASE_URL || "https://api.featherless.ai/v1"
  const prompt = [
    `The user asked: "${input.originalPrompt}"`,
    `Here is the raw API response data: ${JSON.stringify(slimSteps(input.executedSteps))}`,
    "",
    "Format this into a clear, friendly, readable answer for the user.",
    "Present key information naturally. Use bullet points or short paragraphs as appropriate.",
    "Do NOT mention APIs, payments, infrastructure, or raw data. Just answer the user's question.",
  ].join("\n")

  try {
    const content = await openAICompatChat({
      baseUrl,
      apiKey,
      model,
      prompt,
      tag: "featherlessSummarize",
    })
    if (!content) {
      console.error("[featherlessSummarize] Got empty content from Featherless")
      return { ok: false, error: "Empty response from Featherless" }
    }
    return { ok: true, text: content.trim() }
  } catch (error) {
    console.error("[featherlessSummarize] threw:", error)
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Featherless summary failed",
    }
  }
}


