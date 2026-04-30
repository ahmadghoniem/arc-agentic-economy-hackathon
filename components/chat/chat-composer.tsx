"use client"

import { PaperPlaneRightIcon } from "@phosphor-icons/react"

import type { ModelGroup } from "@/components/chat/types"
import { Button } from "@/components/ui/button"
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { chatEndpoints } from "@/lib/services/skill-catalog"

type ChatComposerProps = {
  input: string
  onInputChange: (value: string) => void
  onSubmit: () => void
  disabled: boolean
  selectedEndpoint: string
  onEndpointChange: (value: string) => void
  selectedModel: string
  onModelChange: (value: string) => void
  modelGroups: ModelGroup[]
}

export function ChatComposer({
  input,
  onInputChange,
  onSubmit,
  disabled,
  selectedEndpoint,
  onEndpointChange,
  selectedModel,
  onModelChange,
  modelGroups,
}: ChatComposerProps) {
  return (
    <div className="absolute inset-x-0 bottom-0 border-t border-divider bg-background p-4">
      <div className="mx-auto max-w-3xl">
        <PromptInput
          value={input}
          onValueChange={onInputChange}
          onSubmit={onSubmit}
          disabled={disabled}
          maxHeight={220}
          className="min-h-31 gap-3 rounded-3xl border-foreground/10 bg-background p-4 shadow-lg ring-0 focus-within:border-foreground/25"
        >
          <PromptInputTextarea
            placeholder="Ask anything. Your agent will find and pay the right APIs..."
            className="min-h-16 bg-transparent px-0 py-0 text-foreground placeholder:text-muted-foreground"
          />
          <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
            <PromptInputActions className="min-w-0">
              <Select
                value={selectedEndpoint}
                onValueChange={(v) => {
                  if (v) onEndpointChange(v)
                }}
                disabled={disabled}
              >
                <PromptInputAction tooltip="Select skill">
                  <SelectTrigger
                    size="pill"
                    className="max-w-47.5 border-transparent bg-transparent font-mono text-muted-foreground shadow-none hover:bg-muted"
                  >
                    <SelectValue />
                  </SelectTrigger>
                </PromptInputAction>
                <SelectContent
                  side="top"
                  align="start"
                  className="w-52 border border-divider bg-card text-foreground"
                >
                  {chatEndpoints.map((endpoint) => (
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
                onValueChange={(v) => {
                  if (v) onModelChange(v)
                }}
                disabled={disabled}
              >
                <PromptInputAction tooltip="Select model">
                  <SelectTrigger
                    size="pill"
                    className="max-w-47.5 border-transparent bg-transparent font-mono text-muted-foreground shadow-none hover:bg-muted"
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
                      <SelectLabel className="text-xs tracking-widest text-muted-foreground uppercase">
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
                  disabled={!input.trim() || disabled}
                  size="icon"
                  onClick={onSubmit}
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
  )
}
