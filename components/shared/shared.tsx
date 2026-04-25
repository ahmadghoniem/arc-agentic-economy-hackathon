"use client"

import { CopyIcon } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

function copyText(value: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    void navigator.clipboard.writeText(value)
  }
}

export function StatusDot({
  className,
  pulse,
}: {
  className: string
  pulse?: boolean
}) {
  return (
    <span
      className={cn("inline-flex size-1.5 rounded-full", className, {
        "animate-pulse": pulse,
      })}
    />
  )
}

export function CopyButton({ value, label }: { value: string; label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => copyText(value)}
          />
        }
      >
        <CopyIcon size={16} weight="bold" />
        <span className="sr-only">{label}</span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
