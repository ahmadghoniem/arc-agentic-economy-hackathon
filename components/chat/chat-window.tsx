"use client"

import * as React from "react"

import { ChatComposer } from "@/components/chat/chat-composer"
import {
  getSuggestionsForEndpoint,
  modelGroups as fallbackModelGroups,
} from "@/components/chat/chat-data"
import { ChatThread } from "@/components/chat/chat-thread"
import { SessionTopbar } from "@/components/chat/session-topbar"
import type { ModelGroup } from "@/components/chat/types"
import { useDemoRunner } from "@/components/chat/use-demo-runner"

export function ChatWindow() {
  const [selectedModel, setSelectedModel] = React.useState(
    "Qwen/Qwen3-8B"
  )
  const [selectedEndpoint, setSelectedEndpoint] = React.useState("Auto")
  const [input, setInput] = React.useState("")
  const [modelGroups, setModelGroups] =
    React.useState<ModelGroup[]>(fallbackModelGroups)

  const availableModels = React.useMemo(
    () => modelGroups.flatMap((group) => group.models),
    [modelGroups]
  )
  const effectiveSelectedModel = availableModels.includes(selectedModel)
    ? selectedModel
    : (availableModels[0] ?? selectedModel)

  const {
    isProcessing,
    showInitialLoader,
    clarificationRequest,
    planRequest,
    steps,
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
  } = useDemoRunner(selectedEndpoint, effectiveSelectedModel)

  const suggestions = React.useMemo(
    () => getSuggestionsForEndpoint(selectedEndpoint),
    [selectedEndpoint]
  )
  const isComposerDisabled =
    isProcessing || Boolean(clarificationRequest) || Boolean(planRequest)

  React.useEffect(() => {
    const controller = new AbortController()

    async function loadModels() {
      try {
        const res = await fetch("/api/agent/models", {
          cache: "no-store",
          signal: controller.signal,
        })
        const payload = (await res.json().catch(() => null)) as {
          ok?: boolean
          groups?: Array<{
            provider: string
            models: Array<{ id: string; enabled: boolean }>
          }>
        } | null
        if (!res.ok || !payload?.ok || !Array.isArray(payload.groups)) return

        const groups: ModelGroup[] = payload.groups
          .map((group) => ({
            provider: group.provider.toUpperCase(),
            models: group.models
              .filter((model) => model.enabled)
              .map((model) => model.id),
          }))
          .filter((group) => group.models.length > 0)

        if (groups.length === 0) return
        setModelGroups(groups)
      } catch {
        // Keep static fallback models.
      }
    }

    void loadModels()
    return () => controller.abort()
  }, [])

  const handleSubmit = React.useCallback(() => {
    const prompt = input.trim()
    if (!prompt || isComposerDisabled) return

    submitMessage(prompt)
    setInput("")
  }, [input, isComposerDisabled, submitMessage])

  const handleSuggestionSelect = React.useCallback(
    (suggestion: string) => {
      if (isComposerDisabled) return
      submitMessage(suggestion)
    },
    [isComposerDisabled, submitMessage]
  )

  return (
    <main className="relative flex h-full min-w-0 flex-1 flex-col bg-background">
      <SessionTopbar
        sessionTitle={sessionTitle}
        totalSpent={totalSpent}
        apiCalls={apiCalls}
        onClear={clearChat}
      />

      <ChatThread
        suggestions={suggestions}
        visibleMessages={visibleMessages}
        finalAssistantMessage={finalAssistantMessage}
        showInitialLoader={showInitialLoader}
        isProcessing={isProcessing}
        hasTrace={hasTrace}
        steps={steps}
        clarificationRequest={clarificationRequest}
        planRequest={planRequest}
        onSuggestionSelect={handleSuggestionSelect}
        onClarificationChange={updateClarificationValue}
        onClarificationSubmit={submitClarification}
        onPlanConfirm={confirmPlan}
        onPlanCancel={cancelPlan}
      />

      <ChatComposer
        input={input}
        onInputChange={setInput}
        onSubmit={handleSubmit}
        disabled={isComposerDisabled}
        selectedEndpoint={selectedEndpoint}
        onEndpointChange={setSelectedEndpoint}
        selectedModel={effectiveSelectedModel}
        onModelChange={setSelectedModel}
        modelGroups={modelGroups}
      />
    </main>
  )
}
