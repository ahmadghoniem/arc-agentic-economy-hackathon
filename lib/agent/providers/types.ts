export type ProviderPlanStep = {
  toolId: string
  reason: string
  input: Record<string, unknown>
}

export type ProviderPlanResult = {
  summary: string
  steps: ProviderPlanStep[]
  message: string
}

export type ProviderCallResult = {
  ok: boolean
  provider: "featherless"
  data?: ProviderPlanResult
  error?: string
}

export type ProviderAnswerResult = {
  ok: boolean
  text?: string
  error?: string
}
