import { getAllowlistedTools, type PaidApiTool } from "@/lib/agent/api-catalog"
import { inferProviderFromModel, type ProviderId } from "@/lib/agent/model-registry"
import { aivmlPlan } from "@/lib/agent/providers/aivml"
import { featherlessPlan } from "@/lib/agent/providers/featherless"
import { geminiPlan } from "@/lib/agent/providers/gemini"
import type { AgentPlan, AgentPlanStep } from "@/lib/agent/types"

function totalCost(steps: AgentPlanStep[]) {
  const total = steps.reduce((sum, step) => sum + Number.parseFloat(step.estimatedCostUSDC || "0"), 0)
  return total.toFixed(4)
}

function normalizeStep(tool: PaidApiTool, index: number, reason: string, input: Record<string, unknown>, dependsOn?: string[]) {
  return {
    id: `step_${index + 1}`,
    toolId: tool.id,
    toolName: tool.name,
    reason,
    endpoint: tool.endpoint,
    estimatedCostUSDC: tool.priceUSDC || "0",
    input,
    dependsOn,
  }
}

function fallbackPlanner(prompt: string, tools: PaidApiTool[]): AgentPlan {
  const text = prompt.toLowerCase().trim()
  const get = (id: string) => tools.find((tool) => tool.id === id)

  const steps: AgentPlanStep[] = []

  const knowledge = get("knowledge_search")
  const social = get("social_profile")
  const weather = get("weather")
  const market = get("market_data")
  const docs = get("code_docs")
  const products = get("product_discovery")
  const blocked = get("blocked_external")

  const isCapabilitiesQuery =
    text === "what can you do?" ||
    text === "what can you do" ||
    text.includes("available api") ||
    text.includes("what are your features")

  const isGreeting =
    text === "hi" ||
    text === "hello" ||
    text === "hey" ||
    text === "yo"

  if (text.includes("stripe") && blocked) {
    steps.push(normalizeStep(blocked, 0, "Requested blocked external endpoint.", { endpoint: blocked.endpoint }))
  } else if ((text.includes("who created") || text.includes("founder")) && (text.includes("twitter") || text.includes("followers")) && knowledge && social) {
    steps.push(normalizeStep(knowledge, 0, "Need factual lookup to identify creator.", { q: prompt }))
    steps.push(normalizeStep(social, 1, "Need social profile follower count.", { name: "Derived from knowledge result" }, ["step_1"]))
  } else if (text.includes("weather") && weather) {
    steps.push(normalizeStep(weather, 0, "Need weather data by location.", { location: prompt.replace(/.*weather\s+(in|for)?/i, "").trim() || "Unknown" }))
  } else if ((text.includes("market") || text.includes("price") || text.includes("token") || text.includes("crypto") || text.includes("bitcoin") || text.includes("stock")) && market) {
    steps.push(normalizeStep(market, 0, "Need market pricing information.", { q: prompt }))
  } else if (
    (text.includes("jacket")
      || text.includes("shopping")
      || text.includes("buy")
      || text.includes("purchase")
      || text.includes("order")
      || text.includes("get me")
      || text.includes("find me")
      || text.includes("product")
      || text.includes("recommend")
      || text.includes("phone")
      || text.includes("laptop")
      || text.includes("headphone")
      || text.includes("shoe")
      || text.includes("watch")
      || text.includes("book")
      || text.includes("subscription")
      || text.includes("chatgpt")
      || text.includes("netflix")
      || text.includes("spotify")
      || text.includes("game")
      || text.includes("coffee")
      || text.includes("apple")
      || text.includes("gift")
      || text.includes("clothes")
      || text.includes("electronics")
      || text.includes("shop"))
      && products
  ) {
    steps.push(normalizeStep(products, 0, "Need product discovery results for requested shopping intent.", { q: prompt }))
  } else if ((text.includes("doc") || text.includes("code") || text.includes("github") || text.includes("x402")) && docs) {
    steps.push(normalizeStep(docs, 0, "Need developer docs/code references.", { q: prompt }))
  }

  if (isCapabilitiesQuery) {
    const available = tools
      .filter((tool) => tool.allowlisted)
      .map((tool) => `- ${tool.name}: ${tool.priceUSDC} USDC`)
      .join("\n")
    return {
      ok: true,
      provider: "fallback",
      originalPrompt: prompt,
      summary: "Available paid API domains",
      steps: [],
      totalEstimatedCostUSDC: "0.0000",
      requiresUserConfirmation: true,
      message:
        `Here's what I can do right now:\n\n${available}\n\nTry one of these:\n- "Who created Linux and how many Twitter followers do they have?"\n- "Buy me an online apple"\n- "Help me purchase the ChatGPT subscription"\n- "Weather in Delhi"\n- "Market data for USDC"`,
    }
  }

  if (isGreeting) {
    return {
      ok: true,
      provider: "fallback",
      originalPrompt: prompt,
      summary: "Greeting",
      steps: [],
      totalEstimatedCostUSDC: "0.0000",
      requiresUserConfirmation: true,
      message:
        "Hey! I can help with paid API workflows — shopping, knowledge lookup, social profiles, weather, market data, docs, and more. Just tell me what you need and I'll plan it step-by-step with on-chain payments.",
    }
  }

  if (steps.length === 0) {
    return {
      ok: true,
      provider: "fallback",
      originalPrompt: prompt,
      summary: "No approved tool selected",
      steps: [],
      totalEstimatedCostUSDC: "0.0000",
      requiresUserConfirmation: true,
      message:
        "I couldn't map that to an approved paid API yet. Try rephrasing with one of these domains: knowledge, social, shopping, weather, market, or code/docs.",
    }
  }

  return {
    ok: true,
    provider: "fallback",
    originalPrompt: prompt,
    summary: "Fallback planner generated a tool workflow.",
    steps,
    totalEstimatedCostUSDC: totalCost(steps),
    requiresUserConfirmation: true,
    message: `I need ${steps.length} paid API call(s) to answer this.`,
  }
}

function chooseProvider(provider: "auto" | "gemini" | "featherless" | "aivml", model: string): ProviderId | null {
  if (provider !== "auto") return provider
  const inferred = inferProviderFromModel(model)
  if (inferred) return inferred

  if (process.env.GEMINI_API_KEY) return "gemini"
  if (process.env.FEATHERLESS_API_KEY) return "featherless"
  if (process.env.AIVML_API_KEY && process.env.AIVML_BASE_URL) return "aivml"
  return null
}

function normalizeProviderPlan(
  prompt: string,
  provider: "gemini" | "featherless" | "aivml" | "fallback",
  tools: PaidApiTool[],
  providerPlan: { summary?: string; message?: string; steps?: Array<{ toolId?: string; reason?: string; input?: Record<string, unknown> }> }
): AgentPlan {
  const steps: AgentPlanStep[] = []

  for (const raw of providerPlan.steps || []) {
    if (!raw.toolId) continue
    const tool = tools.find((item) => item.id === raw.toolId)
    if (!tool) continue
    const reason = raw.reason || `Using ${tool.name} for requested task.`
    steps.push(normalizeStep(tool, steps.length, reason, raw.input || {}))
  }

  if (steps.length === 0) {
    return fallbackPlanner(prompt, tools)
  }

  return {
    ok: true,
    provider,
    originalPrompt: prompt,
    summary: providerPlan.summary || "AI planner generated paid API workflow.",
    steps,
    totalEstimatedCostUSDC: totalCost(steps),
    requiresUserConfirmation: true,
    message: providerPlan.message || `I need ${steps.length} paid API call(s) to complete this.`,
  }
}

export async function planAgentTask(input: {
  provider: "auto" | "gemini" | "featherless" | "aivml"
  model: string
  prompt: string
  availableTools: PaidApiTool[]
}): Promise<AgentPlan> {
  const tools = input.availableTools.length > 0 ? input.availableTools : getAllowlistedTools()
  const chosen = chooseProvider(input.provider, input.model)

  if (!chosen) {
    return fallbackPlanner(input.prompt, tools)
  }

  if (chosen === "gemini") {
    const response = await geminiPlan({
      model: input.model,
      prompt: input.prompt,
      availableTools: tools.map((tool) => ({
        id: tool.id,
        name: tool.name,
        endpoint: tool.endpoint,
        priceUSDC: tool.priceUSDC,
        aliases: tool.aliases,
      })),
    })
    if (response.ok && response.data) {
      return normalizeProviderPlan(input.prompt, "gemini", tools, response.data)
    }
  }

  if (chosen === "featherless") {
    const response = await featherlessPlan({
      model: input.model,
      prompt: input.prompt,
      availableTools: tools.map((tool) => ({
        id: tool.id,
        name: tool.name,
        endpoint: tool.endpoint,
        priceUSDC: tool.priceUSDC,
        aliases: tool.aliases,
      })),
    })
    if (response.ok && response.data) {
      return normalizeProviderPlan(input.prompt, "featherless", tools, response.data)
    }
  }

  if (chosen === "aivml") {
    const response = await aivmlPlan({
      model: input.model,
      prompt: input.prompt,
      availableTools: tools.map((tool) => ({
        id: tool.id,
        name: tool.name,
        endpoint: tool.endpoint,
        priceUSDC: tool.priceUSDC,
        aliases: tool.aliases,
      })),
    })
    if (response.ok && response.data) {
      return normalizeProviderPlan(input.prompt, "aivml", tools, response.data)
    }
  }

  return fallbackPlanner(input.prompt, tools)
}
