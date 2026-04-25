"use client"

import type { ChatMessage, TraceStep } from "@/components/chat/types"
import type { ClarificationRequest } from "@/components/chat/use-demo-runner"
import { ClarificationCard } from "@/components/chat/clarification-card"
import { AgentExecutionTrace } from "@/components/chat/execution-trace"
import {
  ChatContainerContent,
  ChatContainerRoot,
  ChatContainerScrollAnchor,
} from "@/components/ui/chat-container"
import { Loader } from "@/components/ui/loader"
import { Message, MessageContent } from "@/components/ui/message"
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
  onSuggestionSelect: (suggestion: string) => void
  onClarificationChange: (value: string) => void
  onClarificationSubmit: () => void
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
  onSuggestionSelect,
  onClarificationChange,
  onClarificationSubmit,
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
                  variant="outline"
                  onClick={() => onSuggestionSelect(suggestion)}
                  className="h-auto max-w-full justify-start rounded-lg border-divider bg-card px-3 py-2 text-left text-sm whitespace-normal text-muted-foreground hover:text-foreground"
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
            <AgentExecutionTrace key={visibleMessages.length} steps={steps} />
          </div>
        ) : null}

        {finalAssistantMessage ? (
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
