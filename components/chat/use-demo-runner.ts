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

/**
 * useDemoRunner
 *
 * Thin orchestrator that wires together:
 *   - chat message state + persistence
 *   - trace step state (via useTraceSteps)
 *   - the plan/execute/final-answer pipeline (phase helpers in
 *     execution-phases.ts)
 *
 * Keeps each concern small enough to follow without scrolling. Heavier
 * logic lives in the phase helpers and the agent-format utilities.
 */
export function useDemoRunner(selectedEndpoint: string, selectedModel: string) {
  // ── Chat messages ──────────────────────────────────────────────────────────
  const [messages, setMessages] = React.useState<ChatMessage[]>(() =>
    loadFromStorage(CHAT_STORAGE_KEYS.messages, [])
  )
  React.useEffect(() => {
    saveToStorage(CHAT_STORAGE_KEYS.messages, messages)
  }, [messages])

  // ── Trace steps ────────────────────────────────────────────────────────────
  const { steps, resetSteps, withRun, patchOnce } = useTraceSteps()

  // ── Flow state ─────────────────────────────────────────────────────────────
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

  // Wallet policy fuels the real Step 4 guard assessment.
  const policy = useOmniClawStore((state) => state.account.policy)

  // ── Derived state ──────────────────────────────────────────────────────────
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
  // Hide empty placeholder messages (e.g. while the preamble is in flight).
  const visibleMessages = (
    finalAssistantMessage
      ? messages.filter((m) => m.id !== finalAssistantMessage.id)
      : messages
  ).filter((m) => m.role === "user" || m.content.trim().length > 0)

  // ── Step 1 + 2: Plan ──────────────────────────────────────────────────────
  const submitMessage = React.useCallback(
    async (input: string) => {
      const prompt = input.trim()
      if (!prompt || isProcessing || planRequest || clarificationRequest) return

      // Clarification gate (pre-planning)
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
        // Empty placeholder — preamble streams in here. We don't show the
        // empty message thanks to the `content` check in the chat thread.
        { id: preambleId, role: "assistant", content: "" },
      ])
      resetSteps()
      setPlanRequest(null)
      setClarificationRequest(null)
      setFinalAssistantMessageId(null)
      setIsProcessing(true)
      setShowInitialLoader(true)

      // Step 1 — Reviewing your request
      patch(1, { status: "active", subtitle: "Analyzing your prompt..." })

      // Fire preamble + plan in parallel. Preamble is short and usually
      // resolves first; if it fails we just leave the placeholder empty.
      const preamblePromise = getAgentPreamble({
        provider: inferProvider(selectedModel),
        model: selectedModel,
        prompt,
      }).then((res) => {
        if (!isCurrent()) return
        if (res.ok && res.text) {
          setMessages((curr) =>
            curr.map((m) =>
              m.id === preambleId ? { ...m, content: res.text } : m
            )
          )
          // Once the user sees a confidence-instilling reply, swap the
          // shimmer loader for the inline trace stepper.
          setShowInitialLoader(false)
        }
      })

      const plan = await getAgentPlan({
        provider: inferProvider(selectedModel),
        model: selectedModel,
        prompt,
        endpointFocus: selectedEndpoint,
      })

      // Don't block on the preamble; it's purely cosmetic.
      void preamblePromise

      if (!isCurrent()) return
      setShowInitialLoader(false)

      if (!plan.ok || !plan.steps.length) {
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

      const toolNames = plan.steps.map((s) => s.toolName).join(", ")
      patch(1, {
        status: "completed",
        subtitle: `${plan.steps.length} tool(s) selected: ${toolNames}.`,
      })

      // Step 2 — Checking API endpoints → wait for confirmation
      patch(2, { status: "active", subtitle: "Awaiting your confirmation..." })
      setPlanRequest({ plan, model: selectedModel })
      setIsProcessing(false)
    },
    [
      isProcessing,
      planRequest,
      clarificationRequest,
      selectedEndpoint,
      selectedModel,
      withRun,
      resetSteps,
    ]
  )

  // ── Steps 3 → 6: Execute ──────────────────────────────────────────────────
  const confirmPlan = React.useCallback(async () => {
    if (!planRequest || isProcessing) return

    const { patch, isCurrent } = withRun()

    setIsProcessing(true)
    patch(2, { status: "completed", subtitle: "User confirmed execution." })

    // Fire the real execute call immediately; animate inspect previews while
    // it's in flight.
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

    // Step 3 — replace previews with real inspect substeps.
    const inspectResult = await replayInspectResults({
      executedSteps: execution.steps,
      patch,
      isCurrent,
    })
    if (!inspectResult) return
    const { totalEstimated } = inspectResult

    // Step 4 — real policy-guard assessment.
    const guards = await runPolicyGuards({
      policy,
      executedSteps: execution.steps,
      totalEstimatedUSDC: totalEstimated,
      patch,
      isCurrent,
    })
    if (!guards) return

    // Step 5 — payments.
    const payResult = await replayPayments({
      executedSteps: execution.steps,
      patch,
      isCurrent,
    })
    if (!payResult) return
    const { subSteps: allPaySubs } = payResult

    // Step 6 — final answer (streamed).
    patch(6, { status: "active", subtitle: "Generating final answer..." })

    // Insert an empty assistant bubble that we'll append tokens to as the
    // model streams. The bubble is tracked as the "final" message so the UI
    // renders it at the bottom of the trace.
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
      // The stream route always emits a fallback, so this only fires for
      // network failures. Surface a friendly message in that case.
      if (!streamed) {
        streamed =
          "I couldn't generate the final provider summary, but OmniClaw returned the execution result."
      }
    }

    if (!isCurrent()) return

    // Append the payment receipt now that streaming has finished.
    const paymentProof = buildPaymentProof(execution.steps)
    const answer = `${streamed}\n\nTotal paid: ${formatUSDC(execution.totalPaidUSDC)}.\n\nPayment proof:\n${paymentProof}`
    setMessages((curr) =>
      curr.map((m) => (m.id === answerId ? { ...m, content: answer } : m))
    )

    patch(6, {
      status: "completed",
      subtitle: `Total spent: ${formatUSDC(execution.totalPaidUSDC)} — ${allPaySubs.length} endpoint(s) called.`,
    })
    setPlanRequest(null)
    setIsProcessing(false)
  }, [isProcessing, planRequest, policy, withRun])

  // ── Cancel plan ───────────────────────────────────────────────────────────
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
  }, [planRequest, patchOnce])

  // ── Clarification ─────────────────────────────────────────────────────────
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

  // ── Clear ─────────────────────────────────────────────────────────────────
  const clearChat = React.useCallback(() => {
    setMessages([])
    resetSteps()
    setPlanRequest(null)
    setClarificationRequest(null)
    setFinalAssistantMessageId(null)
    setTotalPaidUSDC("0")
    clearStorage(
      CHAT_STORAGE_KEYS.messages,
      CHAT_STORAGE_KEYS.steps,
      CHAT_STORAGE_KEYS.plan
    )
  }, [resetSteps])

  return {
    // State
    messages,
    steps,
    isProcessing,
    showInitialLoader,
    clarificationRequest,
    planRequest,
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
    confirmPlan,
    cancelPlan,
    clearChat,
  }
}

// Re-export createInitialSteps for any consumers that imported it transitively.
export { createInitialSteps }
