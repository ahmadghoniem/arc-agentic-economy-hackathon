"use client"

import type { ChatMessage, TraceStep } from "@/components/chat/types"
import type { ClarificationRequest } from "@/components/chat/use-demo-runner"
import { ClarificationCard } from "@/components/chat/clarification-card"
import { AgentExecutionTrace } from "@/components/chat/execution-trace"
import { PlanCard, type PlanRequest } from "@/components/chat/plan-card"
import {
  ChatContainerContent,
  ChatContainerRoot,
  ChatContainerScrollAnchor,
} from "@/components/ui/chat-container"
import { Loader } from "@/components/ui/loader"
import { Button } from "@/components/ui/button"
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
} from "@/components/ui/message"
import { CopyIcon } from "@phosphor-icons/react"
import { PromptSuggestion } from "@/components/ui/prompt-suggestion"
import { ScrollButton } from "@/components/ui/scroll-button"
import { cn } from "@/lib/utils"

type ChatThreadProps = {
  suggestions: string[]
  visibleMessages: ChatMessage[]
  finalAssistantMessage: ChatMessage | null
  showInitialLoader: boolean
  isProcessing: boolean
  hasTrace: boolean
  steps: TraceStep[]
  clarificationRequest: ClarificationRequest | null
  planRequest: PlanRequest | null
  onSuggestionSelect: (suggestion: string) => void
  onClarificationChange: (value: string) => void
  onClarificationSubmit: () => void
  onPlanConfirm: () => void
  onPlanCancel: () => void
}

function ChatBubble({ message }: { message: ChatMessage }) {
  return (
    <Message
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
      {message.role === "assistant" && (
        <MessageActions>
          <MessageAction tooltip="Copy to clipboard">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-muted-foreground"
              onClick={() => navigator.clipboard.writeText(message.content)}
            >
              <CopyIcon className="size-4" />
            </Button>
          </MessageAction>
        </MessageActions>
      )}
    </Message>
  )
}

export function ChatThread({
  suggestions,
  visibleMessages,
  finalAssistantMessage,
  showInitialLoader,
  isProcessing,
  hasTrace,
  steps,
  clarificationRequest,
  planRequest,
  onSuggestionSelect,
  onClarificationChange,
  onClarificationSubmit,
  onPlanConfirm,
  onPlanCancel,
}: ChatThreadProps) {
  return (
    <ChatContainerRoot className="min-h-0 flex-1">
      <ChatContainerContent className="space-y-6 px-6 py-6 pb-48">
        {visibleMessages.length === 0 ? (
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
                  className="h-auto max-w-full px-3 py-2 text-left text-sm whitespace-normal"
                  onClick={() => onSuggestionSelect(suggestion)}
                >
                  {suggestion}
                </PromptSuggestion>
              ))}
            </div>
          </div>
        ) : null}

        {visibleMessages.map((message) => (
          <ChatBubble key={message.id} message={message} />
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
            <AgentExecutionTrace steps={steps} />
          </div>
        ) : null}

        {finalAssistantMessage && finalAssistantMessage.content.trim() ? (
          <ChatBubble message={finalAssistantMessage} />
        ) : null}

        {clarificationRequest ? (
          <div className="flex justify-start">
            <ClarificationCard
              request={clarificationRequest}
              onValueChange={onClarificationChange}
              onSubmit={onClarificationSubmit}
            />
          </div>
        ) : null}

        {planRequest ? (
          <div className="flex justify-start">
            <PlanCard
              request={planRequest}
              disabled={isProcessing}
              onConfirm={onPlanConfirm}
              onCancel={onPlanCancel}
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
  )
}
