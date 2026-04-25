"use client"

import { Button } from "@/components/ui/button"
import { CodeBlock, CodeBlockCode } from "@/components/ui/code-block"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import {
  CaretDownIcon,
  CheckCircleIcon,
  GearIcon,
  SpinnerGapIcon,
  XCircleIcon,
} from "@phosphor-icons/react"
import { useState } from "react"

export type ToolPart = {
  type: string
  route?: string
  state:
    | "input-streaming"
    | "input-available"
    | "output-available"
    | "output-error"
  input?: Record<string, unknown>
  output?: Record<string, unknown>
  errorText?: string
}

export type ToolProps = {
  toolPart: ToolPart
  defaultOpen?: boolean
  className?: string
}

const Tool = ({ toolPart, defaultOpen = false, className }: ToolProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const { state, input, output } = toolPart
  const title = toolPart.route ?? toolPart.type

  const getStateIcon = () => {
    switch (state) {
      case "input-streaming":
        return <SpinnerGapIcon className="h-3.5 w-3.5 animate-spin text-route" />
      case "input-available":
        return <GearIcon className="h-3.5 w-3.5 text-pending" />
      case "output-available":
        return <CheckCircleIcon className="h-3.5 w-3.5 text-success" />
      case "output-error":
        return <XCircleIcon className="h-3.5 w-3.5 text-risk" />
      default:
        return <GearIcon className="h-3.5 w-3.5 text-muted-foreground" />
    }
  }

  const getStateBadge = () => {
    const baseClasses = "rounded-full px-1.5 py-0.5 text-xs font-medium"
    switch (state) {
      case "input-streaming":
        return (
          <span className={cn(baseClasses, "bg-route/10 text-route")}>
            Processing
          </span>
        )
      case "input-available":
        return (
          <span className={cn(baseClasses, "bg-pending/10 text-pending")}>
            Ready
          </span>
        )
      case "output-available":
        return (
          <span className={cn(baseClasses, "bg-success/10 text-success")}>
            Completed
          </span>
        )
      case "output-error":
        return (
          <span className={cn(baseClasses, "bg-risk/10 text-risk")}>Error</span>
        )
      default:
        return (
          <span className={cn(baseClasses, "bg-muted text-muted-foreground")}>
            Pending
          </span>
        )
    }
  }

  const formatValue = (value: unknown): string => {
    if (value === null) return "null"
    if (value === undefined) return "undefined"
    if (typeof value === "string") return value
    if (typeof value === "object") {
      return JSON.stringify(value, null, 2)
    }
    return String(value)
  }

  return (
    <div
      className={cn(
        "mt-2 overflow-hidden rounded-md border border-divider bg-card",
        className
      )}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger
          render={
            <Button
              variant="ghost"
              className="h-auto w-full justify-between rounded-b-none bg-card px-2.5 py-1.5 font-normal"
            />
          }
        >
          <div className="flex min-w-0 items-center gap-2">
            {getStateIcon()}
            <span className="min-w-0 truncate font-mono text-sm font-medium">
              {title}
            </span>
            {getStateBadge()}
          </div>
          <CaretDownIcon
            className={cn("h-3.5 w-3.5 shrink-0", isOpen && "rotate-180")}
          />
        </CollapsibleTrigger>
        <CollapsibleContent
          className={cn(
            "border-t border-divider",
            "overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down"
          )}
        >
          <div className="space-y-2 bg-background p-2.5">
            {input && Object.keys(input).length > 0 && (
              <div>
                <h4 className="mb-1.5 text-xs font-medium tracking-widest text-muted-foreground uppercase">
                  Request body
                </h4>
                <CodeBlock>
                  <CodeBlockCode
                    code={formatValue(input)}
                    language="json"
                    theme="github-dark"
                    className="text-xs [&>pre]:px-2.5 [&>pre]:py-2"
                  />
                </CodeBlock>
              </div>
            )}

            {output && (
              <div>
                <h4 className="mb-1.5 text-xs font-medium tracking-widest text-muted-foreground uppercase">
                  Response
                </h4>
                <CodeBlock>
                  <CodeBlockCode
                    code={formatValue(output)}
                    language="json"
                    theme="github-dark"
                    className="text-xs [&>pre]:px-2.5 [&>pre]:py-2"
                  />
                </CodeBlock>
              </div>
            )}

            {state === "output-error" && toolPart.errorText && (
              <div>
                <h4 className="mb-2 text-sm font-medium text-risk">Error</h4>
                <div className="rounded border border-risk/30 bg-risk/10 p-2 text-sm text-risk">
                  {toolPart.errorText}
                </div>
              </div>
            )}

            {state === "input-streaming" && (
              <div className="text-xs text-muted-foreground">
                Processing tool call...
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

export { Tool }
