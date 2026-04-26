export type AgentPlanStep = {
  id: string
  apiId?: string
  toolId: string
  toolName: string
  reason: string
  endpoint: string
  estimatedCostUSDC: string
  input: Record<string, unknown>
  dependsOn?: string[]
}

export type AgentPlan = {
  ok: boolean
  provider: "gemini" | "featherless" | "aivml" | "fallback"
  originalPrompt: string
  summary: string
  steps: AgentPlanStep[]
  totalEstimatedCostUSDC: string
  requiresUserConfirmation: true
  message: string
}
