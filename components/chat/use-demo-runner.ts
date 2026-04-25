/**
 * use-demo-runner.ts
 *
 * Orchestrates the simulated x402 payment flow.
 * This is the single file to replace when wiring up a real API.
 * Swap `runDemo` internals for real fetch calls and stream the trace steps
 * from your backend — everything else (UI, types, components) stays the same.
 */

"use client"

import * as React from "react"

import type { ChatMessage, TraceStep } from "@/components/chat/types"
import {
  buildAssistantMessage,
  createInitialSteps,
  DEMO_ENDPOINT_COUNT,
  DEMO_TOTAL_SPEND,
  INSPECT_TOOLS,
  needsClarification,
  PAYMENT_TOOLS,
} from "@/components/chat/demo-data"

export type ClarificationRequest = {
  message: string
  paramName: string
  value: string
  originalPrompt: string
}

const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms * 2))

const createId = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`

function updateStep(
  steps: TraceStep[],
  id: number,
  patch: Partial<TraceStep>
): TraceStep[] {
  return steps.map((step) => {
    if (step.id !== id) return step
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

export function useDemoRunner(selectedEndpoint: string) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [steps, setSteps] = React.useState<TraceStep[]>(createInitialSteps)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [showInitialLoader, setShowInitialLoader] = React.useState(false)
  const [clarificationRequest, setClarificationRequest] =
    React.useState<ClarificationRequest | null>(null)
  const runIdRef = React.useRef(0)

  const isAutoRoute = selectedEndpoint === "Auto"

  // Derived state
  const hasTrace = steps.some((step) => step.status !== "pending")
  const isComplete = steps[5]?.status === "completed"
  const totalSpent = isComplete ? DEMO_TOTAL_SPEND : "$0.0000 USDC"
  const apiCalls = isComplete ? DEMO_ENDPOINT_COUNT : 0
  const sessionTitle = messages[0]?.content
    ? messages[0].content.slice(0, 44)
    : "New OmniClaw session"
  const finalAssistantMessage =
    hasTrace && messages.at(-1)?.role === "assistant"
      ? (messages.at(-1) ?? null)
      : null
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

      const patch = (id: number, p: Partial<TraceStep>) => {
        if (runIdRef.current === runId) {
          setSteps((curr) => updateStep(curr, id, p))
        }
      }

      setIsProcessing(true)
      setShowInitialLoader(true)
      setClarificationRequest(null)
      setSteps(createInitialSteps())

      await delay(650)
      if (runIdRef.current !== runId) return
      setShowInitialLoader(false)

      patch(1, {
        status: "active",
        subtitle: "Generating chat session title...",
      })
      await delay(650)
      patch(1, { status: "completed", subtitle: "Request reviewed." })

      patch(2, {
        status: "active",
        subtitle: isAutoRoute
          ? "Evaluating Multi-Source Search..."
          : `Evaluating ${selectedEndpoint}...`,
      })
      await delay(700)
      patch(2, {
        status: "completed",
        subtitle: "2 candidate endpoints selected.",
      })

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

      patch(3, {
        status: "active",
        subtitle: "Inspecting /twitter/user/info...",
        subSteps: [
          { ...INSPECT_TOOLS[0], status: "active", output: undefined },
        ],
      })
      await delay(750)
      patch(3, {
        status: "active",
        subtitle: "Inspecting /api/v1/multi-search...",
        subSteps: [
          INSPECT_TOOLS[0],
          { ...INSPECT_TOOLS[1], status: "active", output: undefined },
        ],
      })
      await delay(750)
      patch(3, {
        status: "completed",
        subtitle: "Estimated total: $0.0014 USDC.",
        subSteps: INSPECT_TOOLS,
      })

      patch(4, { status: "active", subtitle: "Assessing daily budget..." })
      await delay(450)
      patch(4, {
        status: "active",
        subtitle: "Checking against allowed recipients...",
      })
      await delay(450)
      patch(4, { status: "completed", subtitle: "All guards passed." })

      patch(5, {
        status: "active",
        subtitle: "Paying twitter/user/info - $0.0004 USDC...",
        subSteps: [
          { ...PAYMENT_TOOLS[0], status: "active", output: undefined },
        ],
      })
      await delay(850)
      patch(5, {
        status: "active",
        subtitle: "Paying api/v1/multi-search - $0.0010 USDC...",
        subSteps: [
          PAYMENT_TOOLS[0],
          { ...PAYMENT_TOOLS[1], status: "active", output: undefined },
        ],
      })
      await delay(850)
      patch(5, {
        status: "completed",
        subtitle: "2 payments confirmed.",
        subSteps: PAYMENT_TOOLS,
      })
      patch(6, {
        status: "completed",
        subtitle: "Total spent: $0.0014 USDC - 2 endpoints called.",
      })

      setMessages((curr) => [
        ...curr,
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

  const submitMessage = React.useCallback(
    (input: string) => {
      const prompt = input.trim()
      if (!prompt || isProcessing || clarificationRequest) return
      setMessages((curr) => [
        ...curr,
        { id: createId("user"), role: "user", content: prompt },
      ])
      void runDemo(prompt)
    },
    [clarificationRequest, isProcessing, runDemo]
  )

  const submitClarification = React.useCallback(() => {
    if (!clarificationRequest?.value.trim()) return
    const clarifiedPrompt = `${clarificationRequest.originalPrompt}\nTwitter handle: ${clarificationRequest.value.trim()}`
    setMessages((curr) => [
      ...curr,
      {
        id: createId("user"),
        role: "user",
        content: clarificationRequest.value.trim(),
      },
    ])
    setClarificationRequest(null)
    void runDemo(clarifiedPrompt, { skipClarification: true })
  }, [clarificationRequest, runDemo])

  const updateClarificationValue = React.useCallback((value: string) => {
    setClarificationRequest((curr) => (curr ? { ...curr, value } : curr))
  }, [])

  return {
    // State
    messages,
    steps,
    isProcessing,
    showInitialLoader,
    clarificationRequest,
    // Derived
    hasTrace,
    totalSpent,
    apiCalls,
    sessionTitle,
    finalAssistantMessage,
    visibleMessages,
    // Actions
    submitMessage,
    submitClarification,
    updateClarificationValue,
  }
}
