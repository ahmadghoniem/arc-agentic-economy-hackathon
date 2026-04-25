"use client"

import * as React from "react"

import { ChatComposer } from "@/components/chat/chat-composer"
import { getSuggestionsForEndpoint } from "@/components/chat/chat-data"
import { ChatThread } from "@/components/chat/chat-thread"
import { SessionTopbar } from "@/components/chat/session-topbar"
import { useDemoRunner } from "@/components/chat/use-demo-runner"

export function ChatWindow() {
  const [selectedModel, setSelectedModel] = React.useState("gemini-2.0-flash")
  const [selectedEndpoint, setSelectedEndpoint] = React.useState("Auto")
  const [input, setInput] = React.useState("")

  const {
    isProcessing,
    showInitialLoader,
    clarificationRequest,
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
  } = useDemoRunner(selectedEndpoint)

  const suggestions = React.useMemo(
    () => getSuggestionsForEndpoint(selectedEndpoint),
    [selectedEndpoint]
  )
  const isComposerDisabled = isProcessing || Boolean(clarificationRequest)

  const handleSubmit = React.useCallback(() => {
    const prompt = input.trim()
    if (!prompt || isComposerDisabled) return

    submitMessage(prompt)
    setInput("")
  }, [input, isComposerDisabled, submitMessage])

  return (
    <main className="relative flex h-full min-w-0 flex-1 flex-col bg-background">
      <SessionTopbar
        sessionTitle={sessionTitle}
        totalSpent={totalSpent}
        apiCalls={apiCalls}
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
        onSuggestionSelect={setInput}
        onClarificationChange={updateClarificationValue}
        onClarificationSubmit={submitClarification}
      />

      <ChatComposer
        input={input}
        onInputChange={setInput}
        onSubmit={handleSubmit}
        disabled={isComposerDisabled}
        selectedEndpoint={selectedEndpoint}
        onEndpointChange={setSelectedEndpoint}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
      />
    </main>
  )
}
