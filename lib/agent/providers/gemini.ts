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

/**
 * Strip `inspect` and `payment` blobs from executed steps before sending to
 * the LLM. Only `apiId` + `response.data` is needed for summarisation — the
 * full payloads can be hundreds of KB and cause token-limit failures or
 * timeouts.
 */
function slimSteps(executedSteps: unknown): unknown {
  if (!Array.isArray(executedSteps)) return executedSteps
  return executedSteps.map((step: Record<string, unknown>) => ({
    apiId: step.apiId ?? step.toolId,
    result: (step.response as Record<string, unknown> | undefined)?.data,
  }))
}

function extractJson(text: string): ProviderPlanResult | null {
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

export async function geminiPlan(input: {
  model: string
  prompt: string
  availableTools: AvailableTool[]
}): Promise<ProviderCallResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return { ok: false, provider: "gemini", error: "GEMINI_API_KEY is missing" }
  }

  const model = input.model || process.env.GEMINI_MODEL || "gemini-2.5-flash"

  const instruction = [
    "You are an API routing planner. Select the correct tool and populate its parameters from the user prompt.",
    "Return JSON only. No markdown, no explanation.",
    "",
    "CRITICAL RULES:",
    "1. Choose the tool whose `description` and `path` best matches the user's intent.",
    "   - If the user asks for tweets/posts/timeline, use the tweets tool — NOT the profile tool.",
    "   - If the user asks for trending topics, use the trends tool.",
    "2. Build `input` using the `params` schema for the chosen tool.",
    "   - Every param with required=true MUST be in `input`.",
    "   - Use the `description` and `example` in each param to understand what value to supply.",
    "3. COINGECKO IDs: The `ids` param must use CoinGecko slug names, NOT ticker symbols.",
    "   WRONG: 'btc', 'eth', 'sol', 'xrp'. RIGHT: 'bitcoin', 'ethereum', 'solana', 'ripple'.",
    "   Map: btc→bitcoin, eth→ethereum, sol→solana, xrp→ripple, doge→dogecoin, ada→cardano,",
    "        bnb→binancecoin, avax→avalanche-2, dot→polkadot, matic→matic-network.",
    "4. TWITTER usernames: strip the leading @ symbol. '@elonmusk' → 'elonmusk'.",
    "5. TWITTER trends woeid: default to '1' (worldwide) unless a specific location is given.",
    "6. YOUTUBE engine param: always set to 'youtube' exactly.",
    "7. PERPLEXITY messages: always build as [{\"role\":\"user\",\"content\":\"<user question>\"}].",
    "8. STOCK period: must be exactly 'annual', 'quarterly', or 'ttm'.",
    "9. Do NOT create payment intents. Do NOT execute payments. Only plan.",
    "",
    'Output schema: {"summary":"string","message":"string","steps":[{"toolId":"string","reason":"string","input":{"param":"value"}}]}',
    "",
    `User prompt: ${input.prompt}`,
    `Available tools: ${JSON.stringify(input.availableTools)}`,
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
      return {
        ok: false,
        provider: "gemini",
        error: `Gemini request failed (${response.status})`,
      }
    }

    const payload = (await response.json()) as Record<string, unknown>
    const parts =
      ((payload.candidates as Array<Record<string, unknown>> | undefined)?.[0]
        ?.content as Record<string, unknown> | undefined)
        ?.parts as Array<Record<string, unknown>> | undefined
    const outputText = String(parts?.[0]?.text || "")
    const parsed = extractJson(outputText)
    if (!parsed) {
      return {
        ok: false,
        provider: "gemini",
        error: "Gemini returned invalid JSON plan",
      }
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

export async function geminiPreamble(input: {
  model: string
  prompt: string
}): Promise<ProviderAnswerResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return { ok: false, error: "GEMINI_API_KEY is missing" }

  // Use the lightest available model for the preamble — it fires in parallel
  // with the planner and must not compete for quota on the primary model.
  const model = "gemini-2.0-flash-lite"
  const instruction = [
    "You're an AI shopping agent that pays for API endpoints on the user's behalf.",
    "Acknowledge the user's request in ONE short sentence (max 18 words).",
    "Be confident and friendly. Tell them what you'll do next, in plain language.",
    "Do NOT list endpoints. Do NOT mention payments, USDC, or x402.",
    "Do NOT ask questions. Do NOT add quotes around your reply.",
    "",
    `User prompt: ${input.prompt}`,
  ].join("\n")

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: instruction }] }],
          generationConfig: { temperature: 0.6, maxOutputTokens: 60 },
        }),
      }
    )

    if (!response.ok) {
      return {
        ok: false,
        error: `Gemini preamble failed (${response.status})`,
      }
    }

    const payload = (await response.json()) as Record<string, unknown>
    const text =
      ((((payload.candidates as Array<Record<string, unknown>> | undefined)?.[0]
        ?.content as Record<string, unknown> | undefined)
        ?.parts as Array<Record<string, unknown>> | undefined)?.[0]
        ?.text as string | undefined) || ""
    return { ok: true, text: text.trim().replace(/^["']|["']$/g, "") }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Gemini preamble failed",
    }
  }
}

/**
 * Streaming variant of geminiSummarize. Yields text chunks as Gemini
 * generates them via the streamGenerateContent endpoint. Falls back to
 * yielding the entire text at the end if the streaming response can't be
 * parsed (network blip, format change, etc.).
 */
export async function* geminiSummarizeStream(input: {
  model: string
  originalPrompt: string
  executedSteps: unknown
}): AsyncGenerator<string, void, unknown> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error("GEMINI_API_KEY is missing")

  const model = input.model || process.env.GEMINI_MODEL || "gemini-2.5-flash"
  const prompt = [
    `The user asked: "${input.originalPrompt}"`,
    `Here is the raw API response data: ${JSON.stringify(slimSteps(input.executedSteps))}`,
    "",
    "Format this into a clear, friendly, readable answer for the user.",
    "Present key information naturally. Use bullet points or short paragraphs as appropriate.",
    "Do NOT mention APIs, payments, infrastructure, or raw data. Just answer the user's question.",
  ].join("\n")

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 },
      }),
    }
  )

  if (!response.ok || !response.body) {
    throw new Error(`Gemini stream failed (${response.status})`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    // SSE messages are separated by \n\n.
    let sepIndex
    while ((sepIndex = buffer.indexOf("\n\n")) !== -1) {
      const event = buffer.slice(0, sepIndex)
      buffer = buffer.slice(sepIndex + 2)
      // Each event has "data: <json>" lines — sometimes multiple.
      for (const line of event.split("\n")) {
        const trimmed = line.trim()
        if (!trimmed.startsWith("data:")) continue
        const json = trimmed.slice(5).trim()
        if (!json || json === "[DONE]") continue
        try {
          const parsed = JSON.parse(json) as Record<string, unknown>
          const parts =
            ((parsed.candidates as Array<Record<string, unknown>> | undefined)?.[0]
              ?.content as Record<string, unknown> | undefined)
              ?.parts as Array<Record<string, unknown>> | undefined
          const text = String(parts?.[0]?.text || "")
          if (text) yield text
        } catch {
          // Skip malformed chunks rather than aborting the whole stream.
        }
      }
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
    `The user asked: "${input.originalPrompt}"`,
    `Here is the raw API response data: ${JSON.stringify(slimSteps(input.executedSteps))}`,
    "",
    "Format this into a clear, friendly, readable answer for the user.",
    "Present key information naturally. Use bullet points or short paragraphs as appropriate.",
    "Do NOT mention APIs, payments, infrastructure, or raw data. Just answer the user's question.",
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
      ((((payload.candidates as Array<Record<string, unknown>> | undefined)?.[0]
        ?.content as Record<string, unknown> | undefined)
        ?.parts as Array<Record<string, unknown>> | undefined)?.[0]
        ?.text as string | undefined) || ""

    return { ok: true, text: text.trim() }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Gemini summary failed",
    }
  }
}
