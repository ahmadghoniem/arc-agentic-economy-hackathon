"use client"

import * as React from "react"
import {
  CheckCircleIcon,
  CircleIcon,
  PaperPlaneRightIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react"

import {
  endpoints,
  getSuggestionsForEndpoint,
  modelGroups,
} from "@/components/chat/chat-data"
import type {
  ChatMessage,
  TraceStep,
  TraceStepStatus,
  TraceSubStep,
} from "@/components/chat/types"
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtItem,
  ChainOfThoughtStep,
  ChainOfThoughtTrigger,
} from "@/components/ui/chain-of-thought"
import {
  ChatContainerContent,
  ChatContainerRoot,
  ChatContainerScrollAnchor,
} from "@/components/ui/chat-container"
import { Input } from "@/components/ui/input"
import { Loader } from "@/components/ui/loader"
import { Message, MessageContent } from "@/components/ui/message"
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input"
import { PromptSuggestion } from "@/components/ui/prompt-suggestion"
import { ScrollButton } from "@/components/ui/scroll-button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tool, type ToolPart } from "@/components/ui/tool"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ClarificationRequest = {
  message: string
  paramName: string
  value: string
  originalPrompt: string
}

const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms * 2))

const createId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`

const traceTitles = [
  "Reviewing your request",
  "Checking API endpoints",
  "Calculating transaction estimates",
  "Running payment guards",
  "Executing payments",
  "Completed",
]

const createInitialSteps = (): TraceStep[] =>
  traceTitles.map((title, index) => ({
    id: index + 1,
    title,
    subtitle: "",
    activityLog: [],
    status: "pending",
    subSteps: index + 1 === 3 || index + 1 === 5 ? [] : undefined,
  }))

const inspectTools: TraceSubStep[] = [
  {
    id: "inspect-twitter",
    type: "tool",
    toolName: "inspect",
    route: "/api/v1/x402/inspect",
    status: "completed",
    input: {
      endpoint: "https://api.aisa.one/apis/v2/twitter/user/info",
    },
    output: {
      price: "$0.0004 USDC",
      method: "x402",
      accepts: "USDC",
    },
  },
  {
    id: "inspect-search",
    type: "tool",
    toolName: "inspect",
    route: "/api/v1/x402/inspect",
    status: "completed",
    input: {
      endpoint: "https://api.aisa.one/api/v1/multi-search",
    },
    output: {
      price: "$0.0010 USDC",
      method: "x402",
      accepts: "USDC",
    },
  },
]

const paymentTools: TraceSubStep[] = [
  {
    id: "pay-twitter",
    type: "tool",
    toolName: "pay",
    route: "/api/v1/pay",
    status: "completed",
    input: {
      endpoint: "https://api.aisa.one/apis/v2/twitter/user/info",
      amount: "$0.0004 USDC",
      idempotencyKey: "oc_1776966053861",
    },
    output: {
      status: "confirmed",
      txHash: "227bc5d2-2195-4498",
      route: "OmniClaw Buyer x402",
      data: {
        handle: "@linus__torvalds",
        followers: 213840,
        verified: false,
      },
    },
  },
  {
    id: "pay-search",
    type: "tool",
    toolName: "pay",
    route: "/api/v1/pay",
    status: "completed",
    input: {
      endpoint: "https://api.aisa.one/api/v1/multi-search",
      amount: "$0.0010 USDC",
      idempotencyKey: "oc_1776966053862",
    },
    output: {
      status: "confirmed",
      txHash: "514cc8a1-9d93-4b81",
      route: "OmniClaw Buyer x402",
      data: {
        answer: "Linux was created by Linus Torvalds in 1991.",
        sources: ["kernel.org", "wikipedia.org"],
      },
    },
  },
]

function updateStep(steps: TraceStep[], id: number, patch: Partial<TraceStep>) {
  return steps.map((step) => {
    if (step.id !== id) {
      return step
    }

    const subtitle = patch.subtitle ?? step.subtitle
    const shouldAppendActivity =
      patch.subtitle !== undefined && patch.subtitle !== step.subtitle

    return {
      ...step,
      ...patch,
      activityLog: shouldAppendActivity
        ? [...step.activityLog, subtitle]
        : (patch.activityLog ?? step.activityLog),
    }
  })
}

function toToolPart(subStep: TraceSubStep): ToolPart {
  const stateByStatus: Record<TraceStepStatus, ToolPart["state"]> = {
    pending: "input-available",
    active: "input-streaming",
    completed: "output-available",
    failed: "output-error",
  }

  return {
    type: subStep.toolName,
    route: subStep.route,
    state: stateByStatus[subStep.status],
    input: subStep.input,
    output: subStep.output,
    errorText:
      subStep.status === "failed"
        ? "The tool call could not be completed."
        : undefined,
  }
}

function needsClarification(prompt: string) {
  const lowerPrompt = prompt.toLowerCase()
  return (
    (lowerPrompt.includes("follows me") ||
      lowerPrompt.includes("follow me") ||
      lowerPrompt.includes("my twitter")) &&
    !/@[a-z0-9_]+/i.test(prompt)
  )
}

function buildAssistantMessage(selectedSkill: string) {
  return [
    `I routed this through **${selectedSkill}** and completed the simulated x402 payment flow.`,
    "",
    "- Linux was created by **Linus Torvalds** in 1991.",
    "- The paid Twitter profile lookup returned **213,840 followers** for the demo handle.",
    "- Total simulated spend: **$0.0014 USDC** across **2 endpoints**.",
  ].join("\n")
}

function AgentExecutionTrace({ steps }: { steps: TraceStep[] }) {
  const visibleSteps = steps.filter((step) => step.status !== "pending")

  return (
    <section className="w-full max-w-xl rounded-lg border border-divider bg-card p-4 text-card-foreground">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-medium text-foreground">Execution Trace</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Inspecting routes, guards, payments, and response payloads.
          </p>
        </div>
      </div>

      <ChainOfThought>
        {visibleSteps.map((step) => (
          <TraceStepView key={step.id} step={step} />
        ))}
      </ChainOfThought>
    </section>
  )
}

function TraceStepView({
  step,
  isLast,
}: {
  step: TraceStep
  isLast?: boolean
}) {
  const isActive = step.status === "active"
  const isFailed = step.status === "failed"
  const activityLog = isActive ? [] : step.activityLog

  return (
    <ChainOfThoughtStep open isLast={isLast}>
      <ChainOfThoughtTrigger
        leftIcon={
          isFailed ? (
            <WarningCircleIcon size={14} weight="fill" />
          ) : step.status === "completed" ? (
            <CheckCircleIcon size={14} weight="fill" />
          ) : (
            <CircleIcon size={10} weight={isActive ? "fill" : "regular"} />
          )
        }
        swapIconOnHover={false}
        className={cn("w-full justify-between", {
          "text-zinc-100": isActive,
          "text-zinc-300": step.status === "completed",
          "text-risk": isFailed,
        })}
      >
        <span className="flex w-full min-w-0 flex-col">
          <span>{step.title}</span>
          {isActive && step.subtitle ? (
            <Loader
              variant="text-shimmer"
              size="sm"
              text={step.subtitle}
              className="mt-1"
            />
          ) : null}
        </span>
      </ChainOfThoughtTrigger>
      <ChainOfThoughtContent>
        {activityLog.length > 0 || step.subSteps?.length ? (
          <div className="space-y-3">
            {activityLog.length > 0 ? (
              <ActivityLogDisclosure items={activityLog} />
            ) : null}
            {step.subSteps?.map((subStep) => (
              <Tool
                key={subStep.id}
                toolPart={toToolPart(subStep)}
                defaultOpen={subStep.status === "active"}
              />
            ))}
          </div>
        ) : null}
      </ChainOfThoughtContent>
    </ChainOfThoughtStep>
  )
}

function ActivityLogItems({ items }: { items: string[] }) {
  return (
    <div className="space-y-1">
      {items.map((item, index) => (
        <ChainOfThoughtItem key={`${item}-${index}`} className="text-sm">
          {item}
        </ChainOfThoughtItem>
      ))}
    </div>
  )
}

function ActivityLogDisclosure({ items }: { items: string[] }) {
  const latestActivity = items.at(-1)
  const previousActivity = items.slice(0, -1)

  if (!latestActivity) {
    return null
  }

  if (previousActivity.length === 0) {
    return (
      <ChainOfThoughtItem className="text-sm">
        {latestActivity}
      </ChainOfThoughtItem>
    )
  }

  return (
    <ChainOfThought className="w-full">
      <ChainOfThoughtStep>
        <ChainOfThoughtTrigger
          hideDefaultIcon
          inlineCaret
          className="w-full min-w-0 text-sm"
        >
          {latestActivity}
        </ChainOfThoughtTrigger>
        <ChainOfThoughtContent className="[&>div]:block [&>div>div]:mt-1">
          <ActivityLogItems items={previousActivity} />
        </ChainOfThoughtContent>
      </ChainOfThoughtStep>
    </ChainOfThought>
  )
}

function ClarificationCard({
  request,
  onValueChange,
  onSubmit,
}: {
  request: ClarificationRequest
  onValueChange: (value: string) => void
  onSubmit: () => void
}) {
  return (
    <div className="w-full max-w-xl rounded-xl border border-amber-500/30 bg-zinc-900 p-4">
      <p className="text-foreground">{request.message}</p>
      <label className="mt-4 block text-sm font-medium tracking-widest text-muted-foreground uppercase">
        {request.paramName}
      </label>
      <div className="mt-2 flex gap-2">
        <Input
          value={request.value}
          onChange={(event) => onValueChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              onSubmit()
            }
          }}
          placeholder="@username"
          className="h-9 bg-background"
        />
        <Button
          type="button"
          onClick={onSubmit}
          disabled={!request.value.trim()}
          className="h-9 bg-primary text-primary-foreground"
        >
          Submit
        </Button>
      </div>
    </div>
  )
}

export function ChatWindow() {
  const [selectedModel, setSelectedModel] = React.useState("gemini-2.0-flash")
  const [selectedEndpoint, setSelectedEndpoint] = React.useState("Auto")
  const [input, setInput] = React.useState("")
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [showInitialLoader, setShowInitialLoader] = React.useState(false)
  const [steps, setSteps] = React.useState<TraceStep[]>(createInitialSteps)
  const [clarificationRequest, setClarificationRequest] =
    React.useState<ClarificationRequest | null>(null)
  const runIdRef = React.useRef(0)

  const isAutoRoute = selectedEndpoint === "Auto"
  const suggestions = React.useMemo(
    () => getSuggestionsForEndpoint(selectedEndpoint),
    [selectedEndpoint]
  )
  const totalSpent =
    steps[5]?.status === "completed" ? "$0.0014 USDC" : "$0.0000 USDC"
  const apiCalls = steps[5]?.status === "completed" ? 2 : 0
  const sessionTitle = messages[0]?.content
    ? messages[0].content.slice(0, 44)
    : "New OmniClaw session"
  const hasTrace = steps.some((step) => step.status !== "pending")
  const finalAssistantMessage =
    hasTrace && messages.at(-1)?.role === "assistant" ? messages.at(-1) : null
  const visibleMessages = finalAssistantMessage
    ? messages.slice(0, -1)
    : messages

  React.useEffect(() => {
    return () => {
      runIdRef.current += 1
    }
  }, [])

  const runDemo = React.useCallback(
    async (prompt: string, options?: { skipClarification?: boolean }) => {
      const runId = runIdRef.current + 1
      runIdRef.current = runId

      const updateSteps = (updater: (current: TraceStep[]) => TraceStep[]) => {
        if (runIdRef.current === runId) {
          setSteps((current) => updater(current))
        }
      }

      setIsProcessing(true)
      setShowInitialLoader(true)
      setClarificationRequest(null)
      setSteps(createInitialSteps())

      await delay(650)
      if (runIdRef.current !== runId) return
      setShowInitialLoader(false)

      updateSteps((current) =>
        updateStep(current, 1, {
          status: "active",
          subtitle: "Generating chat session title...",
        })
      )
      await delay(650)
      updateSteps((current) =>
        updateStep(current, 1, {
          status: "completed",
          subtitle: "Request reviewed.",
        })
      )

      updateSteps((current) =>
        updateStep(current, 2, {
          status: "active",
          subtitle: isAutoRoute
            ? "Evaluating Multi-Source Search..."
            : `Evaluating ${selectedEndpoint}...`,
        })
      )
      await delay(700)
      updateSteps((current) =>
        updateStep(current, 2, {
          status: "completed",
          subtitle: "2 candidate endpoints selected.",
        })
      )

      if (!options?.skipClarification && needsClarification(prompt)) {
        setClarificationRequest({
          originalPrompt: prompt,
          value: "",
          paramName: "Twitter handle",
          message:
            "What's your Twitter handle? I need it to check that relationship.",
        })
        setIsProcessing(false)
        return
      }

      updateSteps((current) =>
        updateStep(current, 3, {
          status: "active",
          subtitle: "Inspecting /twitter/user/info...",
          subSteps: [
            { ...inspectTools[0], status: "active", output: undefined },
          ],
        })
      )
      await delay(750)
      updateSteps((current) =>
        updateStep(current, 3, {
          status: "active",
          subtitle: "Inspecting /api/v1/multi-search...",
          subSteps: [
            inspectTools[0],
            { ...inspectTools[1], status: "active", output: undefined },
          ],
        })
      )
      await delay(750)
      updateSteps((current) =>
        updateStep(current, 3, {
          status: "completed",
          subtitle: "Estimated total: $0.0014 USDC.",
          subSteps: inspectTools,
        })
      )

      updateSteps((current) =>
        updateStep(current, 4, {
          status: "active",
          subtitle: "Assessing daily budget...",
        })
      )
      await delay(450)
      updateSteps((current) =>
        updateStep(current, 4, {
          status: "active",
          subtitle: "Checking against allowed recipients...",
        })
      )
      await delay(450)
      updateSteps((current) =>
        updateStep(current, 4, {
          status: "completed",
          subtitle: "All guards passed.",
        })
      )

      updateSteps((current) =>
        updateStep(current, 5, {
          status: "active",
          subtitle: "Paying twitter/user/info - $0.0004 USDC...",
          subSteps: [
            { ...paymentTools[0], status: "active", output: undefined },
          ],
        })
      )
      await delay(850)
      updateSteps((current) =>
        updateStep(current, 5, {
          status: "active",
          subtitle: "Paying api/v1/multi-search - $0.0010 USDC...",
          subSteps: [
            paymentTools[0],
            { ...paymentTools[1], status: "active", output: undefined },
          ],
        })
      )
      await delay(850)
      updateSteps((current) =>
        updateStep(current, 5, {
          status: "completed",
          subtitle: "2 payments confirmed.",
          subSteps: paymentTools,
        })
      )

      updateSteps((current) =>
        updateStep(current, 6, {
          status: "completed",
          subtitle: "Total spent: $0.0014 USDC - 2 endpoints called.",
        })
      )

      setMessages((current) => [
        ...current,
        {
          id: createId("assistant"),
          role: "assistant",
          content: buildAssistantMessage(selectedEndpoint),
        },
      ])
      setIsProcessing(false)
    },
    [isAutoRoute, selectedEndpoint]
  )

  const handleSubmit = React.useCallback(() => {
    const prompt = input.trim()
    if (!prompt || isProcessing || clarificationRequest) return

    setMessages((current) => [
      ...current,
      {
        id: createId("user"),
        role: "user",
        content: prompt,
      },
    ])
    setInput("")
    void runDemo(prompt)
  }, [clarificationRequest, input, isProcessing, runDemo])

  const handleClarificationSubmit = React.useCallback(() => {
    if (!clarificationRequest?.value.trim()) return

    const clarifiedPrompt = `${clarificationRequest.originalPrompt}\nTwitter handle: ${clarificationRequest.value.trim()}`
    setMessages((current) => [
      ...current,
      {
        id: createId("user"),
        role: "user",
        content: clarificationRequest.value.trim(),
      },
    ])
    setClarificationRequest(null)
    void runDemo(clarifiedPrompt, { skipClarification: true })
  }, [clarificationRequest, runDemo])

  return (
    <main className="relative flex h-full min-w-0 flex-1 flex-col bg-background">
      {/* Session topbar */}
      <div className="flex h-11 shrink-0 items-center justify-between gap-4 border-b border-divider px-6">
        <h2 className="truncate text-sm font-medium text-foreground/70">
          {sessionTitle}
        </h2>
        <div className="flex shrink-0 items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
              Spent
            </span>
            <span className="font-mono text-sm font-medium text-payment">
              {totalSpent}
            </span>
          </div>
          <span className="text-muted-foreground/20">·</span>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-sm font-medium text-foreground/80">
              {apiCalls}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
              APIs called
            </span>
          </div>
        </div>
      </div>

      <ChatContainerRoot className="min-h-0 flex-1">
        <ChatContainerContent className="space-y-6 px-6 py-6 pb-48">
          {messages.length === 0 ? (
            <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-end gap-4 py-10">
              <div>
                <h3 className="text-lg font-medium text-foreground">
                  What should OmniClaw route?
                </h3>
                <p className="mt-2 max-w-xl text-muted-foreground">
                  Pick a suggestion or enter a request. The demo will inspect
                  costs, run guards, and show paid API responses as JSON.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <PromptSuggestion
                    key={suggestion}
                    size="sm"
                    variant="outline"
                    onClick={() => setInput(suggestion)}
                    className="h-auto max-w-full justify-start rounded-lg border-divider bg-card px-3 py-2 text-left text-sm whitespace-normal text-muted-foreground hover:text-foreground"
                  >
                    {suggestion}
                  </PromptSuggestion>
                ))}
              </div>
            </div>
          ) : null}

          {visibleMessages.map((message) => (
            <Message
              key={message.id}
              className={cn("w-full", {
                "justify-end": message.role === "user",
                "justify-start": message.role === "assistant",
              })}
            >
              <MessageContent
                markdown={message.role === "assistant"}
                className={cn(
                  "max-w-[82%] rounded-2xl px-4 py-3 leading-relaxed shadow-sm",
                  message.role === "user"
                    ? "rounded-tr-md bg-primary text-primary-foreground"
                    : "rounded-tl-md bg-card text-card-foreground"
                )}
              >
                {message.content}
              </MessageContent>
            </Message>
          ))}

          {showInitialLoader ? (
            <div className="flex justify-start">
              <div className="rounded-lg border border-divider bg-card px-4 py-3">
                <Loader
                  variant="text-shimmer"
                  text="Reviewing your request..."
                  size="sm"
                />
              </div>
            </div>
          ) : null}

          {!showInitialLoader && (isProcessing || hasTrace) ? (
            <div className="flex justify-start">
              <AgentExecutionTrace key={messages.length} steps={steps} />
            </div>
          ) : null}

          {finalAssistantMessage ? (
            <Message
              key={finalAssistantMessage.id}
              className="w-full justify-start"
            >
              <MessageContent
                markdown
                className="max-w-[82%] rounded-2xl rounded-tl-md bg-card px-4 py-3 leading-relaxed text-card-foreground shadow-sm"
              >
                {finalAssistantMessage.content}
              </MessageContent>
            </Message>
          ) : null}

          {clarificationRequest ? (
            <div className="flex justify-start">
              <ClarificationCard
                request={clarificationRequest}
                onValueChange={(value) =>
                  setClarificationRequest((current) =>
                    current ? { ...current, value } : current
                  )
                }
                onSubmit={handleClarificationSubmit}
              />
            </div>
          ) : null}

          <ChatContainerScrollAnchor />
        </ChatContainerContent>
        <div className="pointer-events-none absolute inset-x-0 bottom-36 flex justify-center">
          <ScrollButton
            variant="outline"
            size="icon"
            className="pointer-events-auto border-divider bg-card text-foreground shadow-lg"
          />
        </div>
      </ChatContainerRoot>

      <div className="absolute inset-x-0 bottom-0 border-t border-divider bg-background p-4">
        <div className="mx-auto max-w-3xl">
          <PromptInput
            value={input}
            onValueChange={setInput}
            onSubmit={handleSubmit}
            disabled={isProcessing || Boolean(clarificationRequest)}
            maxHeight={220}
            className="min-h-31 gap-3 rounded-3xl border-foreground/10 bg-background p-4 shadow-lg ring-0 focus-within:border-primary"
          >
            <PromptInputTextarea
              placeholder="Ask anything. Your agent will find and pay the right APIs..."
              className="min-h-16 bg-transparent px-0 py-0 text-foreground placeholder:text-muted-foreground dark:bg-transparent"
            />
            <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
              <PromptInputActions className="min-w-0">
                <Select
                  value={selectedEndpoint}
                  onValueChange={(value) => {
                    if (value) setSelectedEndpoint(value)
                  }}
                  disabled={isProcessing}
                >
                  <PromptInputAction tooltip="Select skill">
                    <SelectTrigger
                      size="sm"
                      className="max-w-47.5 border-0 bg-transparent font-mono text-muted-foreground shadow-none hover:bg-muted dark:bg-transparent dark:hover:bg-muted"
                    >
                      <SelectValue />
                    </SelectTrigger>
                  </PromptInputAction>
                  <SelectContent
                    side="top"
                    align="start"
                    className="w-52 border border-divider bg-card text-foreground"
                  >
                    {endpoints.map((endpoint) => (
                      <SelectItem key={endpoint} value={endpoint}>
                        {endpoint}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </PromptInputActions>

              <PromptInputActions className="justify-end">
                <Select
                  value={selectedModel}
                  onValueChange={(value) => {
                    if (value) setSelectedModel(value)
                  }}
                  disabled={isProcessing}
                >
                  <PromptInputAction tooltip="Select model">
                    <SelectTrigger
                      size="sm"
                      className="max-w-47.5 border-0 bg-transparent font-mono text-muted-foreground shadow-none hover:bg-muted dark:bg-transparent dark:hover:bg-muted"
                    >
                      <SelectValue />
                    </SelectTrigger>
                  </PromptInputAction>
                  <SelectContent
                    side="top"
                    align="end"
                    className="w-56 border border-divider bg-card text-foreground"
                  >
                    {modelGroups.map((group) => (
                      <SelectGroup key={group.provider}>
                        <SelectLabel className="text-sm tracking-widest text-muted-foreground uppercase">
                          {group.provider}
                        </SelectLabel>
                        {group.models.map((model) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
                <PromptInputAction tooltip="Send">
                  <Button
                    type="button"
                    disabled={
                      !input.trim() ||
                      isProcessing ||
                      Boolean(clarificationRequest)
                    }
                    size="icon"
                    onClick={handleSubmit}
                    className="bg-primary text-primary-foreground"
                  >
                    <PaperPlaneRightIcon size={16} weight="bold" />
                    <span className="sr-only">Send</span>
                  </Button>
                </PromptInputAction>
              </PromptInputActions>
            </div>
          </PromptInput>
          <p className="mt-3 text-center text-sm text-muted-foreground">
            Payments via x402 nanopayments - USDC on Arc Testnet
          </p>
        </div>
      </div>
    </main>
  )
}
