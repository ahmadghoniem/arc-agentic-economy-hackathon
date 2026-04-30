export type ModelGroup = {
  provider: string
  models: string[]
}

export type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
}

export type TraceStepStatus = "pending" | "active" | "completed" | "failed"

export type TraceToolName = "inspect" | "pay"

export type TraceSubStep = {
  id: string
  type: "tool"
  toolName: TraceToolName
  route: string
  input: Record<string, unknown>
  output?: Record<string, unknown>
  status: TraceStepStatus
}

export type TraceStep = {
  id: number
  title: string
  subtitle: string
  activityLog: string[]
  status: TraceStepStatus
  subSteps?: TraceSubStep[]
}
