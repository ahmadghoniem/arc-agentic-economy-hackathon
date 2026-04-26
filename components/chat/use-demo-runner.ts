"use client"

import * as React from "react"

import {
  animateInspectPreview,
  replayInspectResults,
  replayPayments,
  runPolicyGuards,
} from "@/components/chat/execution-phases"
import {
  createInitialSteps,
  needsClarification,
} from "@/components/chat/demo-data"
import type { PlanRequest } from "@/components/chat/plan-card"
import type { ChatMessage } from "@/components/chat/types"
import { useTraceSteps } from "@/components/chat/use-trace-steps"
import {
  executeAgentPlan,
  getAgentPlan,
  getAgentPreamble,
  getFinalAnswerStream,
} from "@/lib/agent/client"
import {
  buildPaymentProof,
  formatUSDC,
  inferProvider,
} from "@/lib/agent/format"
import {
  CHAT_STORAGE_KEYS,
  clearStorage,
  loadFromStorage,
  saveToStorage,
} from "@/lib/storage/chat-storage"
import { useOmniClawStore } from "@/lib/stores/omniclaw-store"
import { createId } from "@/lib/utils/id"

export type ClarificationRequest = {
  message: string
  paramName: string
  value: string
  originalPrompt: string
}

export function useDemoRunner(selectedEndpoint: string, selectedModel: string) {
  const submitLockRef = React.useRef(false)
  const confirmLockRef = React.useRef(false)
  const latestProductResultsRef = React.useRef<Array<Record<string, unknown>>>([])

  const [messages, setMessages] = React.useState<ChatMessage[]>(() =>
    loadFromStorage(CHAT_STORAGE_KEYS.messages, [])
  )
  React.useEffect(() => {
    saveToStorage(CHAT_STORAGE_KEYS.messages, messages)
  }, [messages])

  const { steps, resetSteps, withRun, patchOnce } = useTraceSteps()

  const [isProcessing, setIsProcessing] = React.useState(false)
  const [showInitialLoader, setShowInitialLoader] = React.useState(false)
  const [planRequest, setPlanRequest] = React.useState<PlanRequest | null>(() =>
    loadFromStorage(CHAT_STORAGE_KEYS.plan, null)
  )
  React.useEffect(() => {
    saveToStorage(CHAT_STORAGE_KEYS.plan, planRequest)
  }, [planRequest])

  const [clarificationRequest, setClarificationRequest] =
    React.useState<ClarificationRequest | null>(null)
  const [finalAssistantMessageId, setFinalAssistantMessageId] = React.useState<
    string | null
  >(null)
  const [totalPaidUSDC, setTotalPaidUSDC] = React.useState<string>("0")

  const policy = useOmniClawStore((state) => state.account.policy)
  const refreshTransactions = useOmniClawStore(
    (state) => state.refreshTransactions
  )
  const refreshBalance = useOmniClawStore((state) => state.refreshBalance)

  const hasTrace = steps.some((step) => step.status !== "pending")
  const totalSpent = formatUSDC(totalPaidUSDC)
  const apiCalls =
    steps[4]?.subSteps?.filter((s) => s.toolName === "pay").length ?? 0
  const sessionTitle = messages[0]?.content
    ? messages[0].content.slice(0, 44)
    : "New OmniClaw session"
  const finalAssistantMessage = finalAssistantMessageId
    ? (messages.find((m) => m.id === finalAssistantMessageId) ?? null)
    : null
  const visibleMessages = (
    finalAssistantMessage
      ? messages.filter((m) => m.id !== finalAssistantMessage.id)
      : messages
  ).filter((m) => m.role === "user" || m.content.trim().length > 0)

  const submitMessage = React.useCallback(
    async (input: string) => {
      const rawPrompt = input.trim()
      let prompt = rawPrompt
      const lowerPrompt = rawPrompt.toLowerCase()
      if (
        (lowerPrompt.includes("first one") ||
          lowerPrompt.includes("second one") ||
          lowerPrompt.includes("third one")) &&
        latestProductResultsRef.current.length > 0
      ) {
        const index = lowerPrompt.includes("second one")
          ? 1
          : lowerPrompt.includes("third one")
            ? 2
            : 0
        const selected = latestProductResultsRef.current[index]
        if (selected) {
          const name = String(selected.name || "")
          const buyUrl = String(selected.buyUrl || "")
          const priceUsd = String(selected.priceUsd || "")
          prompt =
            `${rawPrompt}\nSelected product: ${name}\nBuy URL: ${buyUrl}\nPrice USD: $${priceUsd}\nSelection index: ${index + 1}`
        }
      }
      if (
        !prompt ||
        isProcessing ||
        planRequest ||
        clarificationRequest ||
        submitLockRef.current
      ) {
        return
      }

      submitLockRef.current = true
      try {
        if (needsClarification(prompt)) {
          setMessages((curr) => [
            ...curr,
            { id: createId("user"), role: "user", content: prompt },
          ])
          setClarificationRequest({
            originalPrompt: prompt,
            value: "",
            paramName: "Twitter handle",
            message:
              "What's your Twitter handle? I need it to check that relationship.",
          })
          return
        }

        const { patch, isCurrent } = withRun()
        const userMessageId = createId("user")
        const preambleId = createId("assistant")

        setMessages((curr) => [
          ...curr,
          { id: userMessageId, role: "user", content: prompt },
          { id: preambleId, role: "assistant", content: "" },
        ])
        resetSteps()
        setPlanRequest(null)
        setClarificationRequest(null)
        setFinalAssistantMessageId(null)
        setIsProcessing(true)
        setShowInitialLoader(true)

        patch(1, { status: "active", subtitle: "Analyzing your prompt..." })

        const preamblePromise = getAgentPreamble({
          provider: inferProvider(selectedModel),
          model: selectedModel,
          prompt,
        }).then((res) => {
          if (!isCurrent()) return
          if (!res.ok || !res.text) return
          setMessages((curr) =>
            curr.map((m) =>
              m.id === preambleId ? { ...m, content: res.text ?? "" } : m
            )
          )
          setShowInitialLoader(false)
        })

        const plan = await getAgentPlan({
          provider: inferProvider(selectedModel),
          model: selectedModel,
          prompt,
          endpointFocus: selectedEndpoint,
        })

        void preamblePromise

        if (!isCurrent()) return
        setShowInitialLoader(false)

        if (!plan.ok) {
          patch(1, {
            status: "failed",
            subtitle: plan.message || "Could not find matching endpoints.",
          })
          setMessages((curr) => [
            ...curr,
            {
              id: createId("assistant"),
              role: "assistant",
              content: plan.message || "Planning failed. Please try again.",
            },
          ])
          setIsProcessing(false)
          return
        }

        if (!plan.steps.length) {
          patch(1, {
            status: "completed",
            subtitle: "No paid API call required for this prompt.",
          })
          setMessages((curr) => [
            ...curr,
            {
              id: createId("assistant"),
              role: "assistant",
              content:
                plan.message ||
                "No paid API was needed. Ask me a task and I'll plan paid calls when relevant.",
            },
          ])
          setIsProcessing(false)
          return
        }

        const toolNames = plan.steps.map((s) => s.toolName).join(", ")
        patch(1, {
          status: "completed",
          subtitle: `${plan.steps.length} tool(s) selected: ${toolNames}.`,
        })
        patch(2, { status: "active", subtitle: "Awaiting your confirmation..." })
        setPlanRequest({ plan, model: selectedModel })
        setIsProcessing(false)
      } finally {
        submitLockRef.current = false
      }
    },
    [
      clarificationRequest,
      isProcessing,
      planRequest,
      resetSteps,
      selectedEndpoint,
      selectedModel,
      withRun,
    ]
  )

  const confirmPlan = React.useCallback(async () => {
    if (!planRequest || isProcessing || confirmLockRef.current) return

    confirmLockRef.current = true
    try {
      const { patch, isCurrent } = withRun()
      setIsProcessing(true)
      patch(2, { status: "completed", subtitle: "User confirmed execution." })

      const executionPromise = executeAgentPlan({
        plan: planRequest.plan,
        confirmed: true,
      })
      await animateInspectPreview({
        plan: planRequest.plan,
        patch,
        isCurrent,
      })

      const execution = await executionPromise
      if (!isCurrent()) return

      if (execution.ok && execution.totalPaidUSDC) {
        setTotalPaidUSDC(execution.totalPaidUSDC)
      }
      for (const executedStep of execution.steps || []) {
        if (executedStep.toolId === "product_discovery") {
          const response = (executedStep.response as Record<string, unknown> | undefined) || {}
          const data = (response.data as Record<string, unknown> | undefined) || {}
          const results = data.results
          if (Array.isArray(results)) {
            latestProductResultsRef.current = results as Array<Record<string, unknown>>
          }
        }
      }

      if (!execution.ok || !execution.steps) {
        patch(3, {
          status: "failed",
          subtitle: execution.error || "Execution failed.",
        })
        patch(5, { status: "failed", subtitle: "No payments made." })
        setMessages((curr) => [
          ...curr,
          {
            id: createId("assistant"),
            role: "assistant",
            content:
              execution.error || "Execution failed. No payment was completed.",
          },
        ])
        setPlanRequest(null)
        setIsProcessing(false)
        return
      }

      const inspectResult = await replayInspectResults({
        executedSteps: execution.steps,
        patch,
        isCurrent,
      })
      if (!inspectResult) return

      const guards = await runPolicyGuards({
        policy,
        executedSteps: execution.steps,
        totalEstimatedUSDC: inspectResult.totalEstimated,
        patch,
        isCurrent,
      })
      if (!guards) return

      const payResult = await replayPayments({
        executedSteps: execution.steps,
        patch,
        isCurrent,
      })
      if (!payResult) return

      patch(6, { status: "active", subtitle: "Generating final answer..." })

      const answerId = createId("assistant")
      setMessages((curr) => [
        ...curr,
        { id: answerId, role: "assistant", content: "" },
      ])
      setFinalAssistantMessageId(answerId)

      let streamed = ""
      try {
        const stream = getFinalAnswerStream({
          provider: planRequest.plan.provider,
          model: planRequest.model,
          originalPrompt: planRequest.plan.originalPrompt,
          executedSteps: execution.steps,
        })
        for await (const chunk of stream) {
          if (!isCurrent()) return
          streamed += chunk
          setMessages((curr) =>
            curr.map((m) => (m.id === answerId ? { ...m, content: streamed } : m))
          )
        }
      } catch {
        if (!streamed) {
          streamed =
            "I couldn't generate the final provider summary, but OmniClaw returned the execution result."
        }
      }

      if (!isCurrent()) return

      const paymentProof = buildPaymentProof(execution.steps)
      const answer = `${streamed}\n\nTotal paid: ${formatUSDC(execution.totalPaidUSDC)}.\n\nPayment proof:\n${paymentProof}`
      setMessages((curr) =>
        curr.map((m) => (m.id === answerId ? { ...m, content: answer } : m))
      )

      patch(6, {
        status: "completed",
        subtitle: `Total spent: ${formatUSDC(execution.totalPaidUSDC)} — ${payResult.subSteps.length} endpoint(s) called.`,
      })
      void Promise.all([refreshTransactions(), refreshBalance()])
      setPlanRequest(null)
      setIsProcessing(false)
    } finally {
      confirmLockRef.current = false
    }
  }, [
    isProcessing,
    planRequest,
    policy,
    refreshBalance,
    refreshTransactions,
    withRun,
  ])

  const cancelPlan = React.useCallback(() => {
    if (!planRequest) return
    setMessages((curr) => [
      ...curr,
      {
        id: createId("assistant"),
        role: "assistant",
        content: "Plan canceled. No payment was executed.",
      },
    ])
    patchOnce(2, {
      status: "failed",
      subtitle: "Execution canceled by user.",
    })
    setPlanRequest(null)
  }, [patchOnce, planRequest])

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
    void submitMessage(clarifiedPrompt)
  }, [clarificationRequest, submitMessage])

  const updateClarificationValue = React.useCallback((value: string) => {
    setClarificationRequest((curr) => (curr ? { ...curr, value } : curr))
  }, [])

  const clearChat = React.useCallback(() => {
    setMessages([])
    resetSteps()
    setPlanRequest(null)
    setClarificationRequest(null)
    setFinalAssistantMessageId(null)
    setTotalPaidUSDC("0")
    latestProductResultsRef.current = []
    clearStorage(
      CHAT_STORAGE_KEYS.messages,
      CHAT_STORAGE_KEYS.steps,
      CHAT_STORAGE_KEYS.plan
    )
  }, [resetSteps])

  return {
    messages,
    steps,
    isProcessing,
    showInitialLoader,
    clarificationRequest,
    planRequest,
    hasTrace,
    totalSpent,
    apiCalls,
    sessionTitle,
    finalAssistantMessage,
    visibleMessages,
    submitMessage,
    submitClarification,
    updateClarificationValue,
    confirmPlan,
    cancelPlan,
    clearChat,
  }
}

export { createInitialSteps }
