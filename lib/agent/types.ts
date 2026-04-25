export type AgentProvider = "gemini" | "featherless" | "fallback"

export type AgentPlanStep = {
  id: string
  toolId: string
  apiId: string
  toolName: string
  reason: string
  estimatedCostUSDC: string
  input: Record<string, unknown>
}

export type AgentPlan = {
  ok: boolean
  provider: AgentProvider
  originalPrompt: string
  summary: string
  steps: AgentPlanStep[]
  totalEstimatedCostUSDC: string
  requiresUserConfirmation: true
  message: string
}
