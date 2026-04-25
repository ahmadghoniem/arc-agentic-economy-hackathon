import { getAvailableTools, type PaidApiTool } from "@/lib/agent/api-catalog"
import {
  inferProviderFromModel,
  type ProviderId,
} from "@/lib/agent/model-registry"
import { featherlessPlan } from "@/lib/agent/providers/featherless"
import { geminiPlan } from "@/lib/agent/providers/gemini"
import type { AgentPlan, AgentPlanStep, AgentProvider } from "@/lib/agent/types"

function totalCost(steps: AgentPlanStep[]) {
  const total = steps.reduce(
    (sum, step) => sum + Number.parseFloat(step.estimatedCostUSDC || "0"),
    0
  )
  return total.toFixed(5)
}

function normalizeStep(
  tool: PaidApiTool,
  index: number,
  reason: string,
  input: Record<string, unknown>
): AgentPlanStep {
  return {
    id: `step_${index + 1}`,
    toolId: tool.id,
    apiId: tool.apiId,
    toolName: tool.name,
    reason,
    estimatedCostUSDC: tool.priceUSDC,
    input,
  }
}

/**
 * Keyword-based fallback planner. Uses requiredParams + aliases from the
 * catalog to pick the right tool and extract params from the prompt.
 */
function fallbackPlanner(
  prompt: string,
  tools: PaidApiTool[],
  endpointFocus?: string
): AgentPlan {
  const text = `${endpointFocus || ""} ${prompt}`.toLowerCase()

  // Extract @handle or "username" from prompt
  const handleMatch = prompt.match(/@(\w+)/)
  const userName = handleMatch?.[1] ?? ""

  // Extract quoted query or fall back to full prompt
  const quotedMatch = prompt.match(/"([^"]+)"/)
  const query = quotedMatch?.[1] ?? prompt

  const pick = (id: string) => tools.find((t) => t.id === id)
  const selected: AgentPlanStep[] = []

  // Tweet timeline — must check before generic twitter profile
  if (
    pick("twitter_last_tweets") &&
    (text.includes("tweet") ||
      text.includes("latest post") ||
      text.includes("recent post") ||
      text.includes("timeline") ||
      text.includes("last tweet"))
  ) {
    selected.push(
      normalizeStep(
        pick("twitter_last_tweets")!,
        0,
        "The request asks for a user's recent tweets.",
        userName ? { userName } : { userName: query }
      )
    )
  } else if (
    pick("twitter_trends") &&
    (text.includes("trending") ||
      text.includes("trends") ||
      text.includes("what's popular"))
  ) {
    selected.push(
      normalizeStep(pick("twitter_trends")!, 0, "The request asks for trending topics.", {
        woeid: "1",
      })
    )
  } else if (
    pick("twitter_advanced_search") &&
    text.includes("search tweet")
  ) {
    selected.push(
      normalizeStep(
        pick("twitter_advanced_search")!,
        0,
        "The request needs tweet search.",
        { query, queryType: "Latest" }
      )
    )
  } else if (
    pick("twitter_user_info") &&
    (text.includes("twitter") ||
      text.includes("followers") ||
      text.includes("profile") ||
      text.includes("@"))
  ) {
    selected.push(
      normalizeStep(
        pick("twitter_user_info")!,
        0,
        "The request needs a Twitter user profile.",
        userName ? { userName } : { userName: query }
      )
    )
  } else if (
    pick("youtube_search") &&
    (text.includes("youtube") ||
      text.includes("video") ||
      text.includes("creator"))
  ) {
    selected.push(
      normalizeStep(pick("youtube_search")!, 0, "The request needs YouTube results.", {
        engine: "youtube",
        q: query,
        gl: "us",
        hl: "en",
      })
    )
  } else if (
    pick("scholar_search") &&
    (text.includes("paper") ||
      text.includes("academic") ||
      text.includes("research paper") ||
      text.includes("scholar"))
  ) {
    selected.push(
      normalizeStep(
        pick("scholar_search")!,
        0,
        "The request needs academic search results.",
        { query, max_num_results: 5 }
      )
    )
  } else if (
    pick("multi_search") &&
    (text.includes("search") ||
      text.includes("news") ||
      text.includes("latest") ||
      text.includes("research"))
  ) {
    selected.push(
      normalizeStep(pick("multi_search")!, 0, "The request needs web search.", {
        query,
        max_num_results: 5,
      })
    )
  } else if (
    pick("crypto_price") &&
    (text.includes("price") ||
      text.includes("bitcoin") ||
      text.includes("ethereum") ||
      text.includes("crypto"))
  ) {
    // Map common ticker symbols to CoinGecko IDs
    const coinIdMap: Record<string, string> = {
      btc: "bitcoin", eth: "ethereum", sol: "solana", xrp: "ripple",
      doge: "dogecoin", ada: "cardano", dot: "polkadot", matic: "matic-network",
      avax: "avalanche-2", link: "chainlink", uni: "uniswap", atom: "cosmos",
    }
    const ids = text.includes("bitcoin") ? "bitcoin"
      : text.includes("ethereum") ? "ethereum"
      : text.includes("solana") ? "solana"
      : coinIdMap[text.match(/\b(btc|eth|sol|xrp|doge|ada|dot|matic|avax|link|uni|atom)\b/)?.[1] ?? ""] || "bitcoin"

    selected.push(
      normalizeStep(pick("crypto_price")!, 0, "The request asks for a crypto price.", {
        ids,
        vs_currencies: "usd",
        include_24hr_change: true,
      })
    )
  } else if (endpointFocus && endpointFocus !== "Auto") {
    const focused = tools.find(
      (t) => t.name.toLowerCase() === endpointFocus.toLowerCase()
    )
    if (focused) {
      selected.push(
        normalizeStep(
          focused,
          0,
          `Using selected endpoint focus: ${endpointFocus}.`,
          { prompt }
        )
      )
    }
  }

  if (selected.length === 0) {
    const skillList = [...new Set(tools.map((t) => t.skill))].join(", ")
    return {
      ok: true,
      provider: "fallback",
      originalPrompt: prompt,
      summary: "No matching tool found",
      steps: [],
      totalEstimatedCostUSDC: "0.00000",
      requiresUserConfirmation: true,
      message: `I couldn't match your request to a paid API. Available skills: ${skillList}.`,
    }
  }

  return {
    ok: true,
    provider: "fallback",
    originalPrompt: prompt,
    summary: "Fallback planner selected a paid API workflow.",
    steps: selected,
    totalEstimatedCostUSDC: totalCost(selected),
    requiresUserConfirmation: true,
    message: `I need ${selected.length} paid API call(s) to answer this.`,
  }
}

function chooseProvider(
  provider: "auto" | ProviderId,
  model: string
): ProviderId | null {
  if (provider !== "auto") return provider
  const inferred = inferProviderFromModel(model)
  if (inferred) return inferred
  if (process.env.GEMINI_API_KEY) return "gemini"
  if (process.env.FEATHERLESS_API_KEY) return "featherless"
  return null
}

function normalizeProviderPlan(
  prompt: string,
  provider: AgentProvider,
  tools: PaidApiTool[],
  providerPlan: {
    summary?: string
    message?: string
    steps?: Array<{
      toolId?: string
      reason?: string
      input?: Record<string, unknown>
    }>
  },
  endpointFocus?: string
): AgentPlan {
  const steps: AgentPlanStep[] = []

  for (const raw of providerPlan.steps || []) {
    if (!raw.toolId) continue
    const tool = tools.find((t) => t.id === raw.toolId)
    if (!tool?.allowlisted) continue

    steps.push(
      normalizeStep(
        tool,
        steps.length,
        raw.reason || `Use ${tool.name} for this request.`,
        raw.input || {}
      )
    )
  }

  if (steps.length === 0) {
    return fallbackPlanner(prompt, tools, endpointFocus)
  }

  return {
    ok: true,
    provider,
    originalPrompt: prompt,
    summary:
      providerPlan.summary || "AI planner selected a paid API workflow.",
    steps,
    totalEstimatedCostUSDC: totalCost(steps),
    requiresUserConfirmation: true,
    message:
      providerPlan.message ||
      `I need ${steps.length} paid API call(s) to answer this.`,
  }
}

export async function planAgentTask(input: {
  provider: "auto" | ProviderId
  model: string
  prompt: string
  endpointFocus?: string
}): Promise<AgentPlan> {
  const tools = getAvailableTools()
  const chosen = chooseProvider(input.provider, input.model)

  // Give the AI the full routing surface including rich param schemas with examples
  const availableTools = tools.map((tool) => ({
    id: tool.id,
    skill: tool.skill,
    name: tool.name,
    description: tool.description,
    path: tool.path,
    method: tool.method,
    priceUSDC: tool.priceUSDC,
    // Rich param schema replaces the thin string arrays — AI gets descriptions + examples
    params: tool.params,
  }))

  if (chosen === "gemini") {
    const response = await geminiPlan({
      model: input.model,
      prompt: input.prompt,
      availableTools,
    })
    if (response.ok && response.data) {
      return normalizeProviderPlan(
        input.prompt,
        "gemini",
        tools,
        response.data,
        input.endpointFocus
      )
    }
  }

  if (chosen === "featherless") {
    const response = await featherlessPlan({
      model: input.model,
      prompt: input.prompt,
      availableTools,
    })
    if (response.ok && response.data) {
      return normalizeProviderPlan(
        input.prompt,
        "featherless",
        tools,
        response.data,
        input.endpointFocus
      )
    }
  }

  return fallbackPlanner(input.prompt, tools, input.endpointFocus)
}
