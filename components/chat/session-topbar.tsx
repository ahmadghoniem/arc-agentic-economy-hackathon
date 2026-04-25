"use client"

import { ArrowCounterClockwiseIcon } from "@phosphor-icons/react"

export function SessionTopbar({
  sessionTitle,
  totalSpent,
  apiCalls,
  onClear,
}: {
  sessionTitle: string
  totalSpent: string
  apiCalls: number
  onClear?: () => void
}) {
  return (
    <div className="flex h-11 shrink-0 items-center justify-between gap-4 border-b border-divider px-6">
      <h2 className="truncate text-sm font-medium text-foreground/70">
        {sessionTitle}
      </h2>
      <div className="flex shrink-0 items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold tracking-widist text-muted-foreground/50 uppercase">
            Spent
          </span>
          <span className="font-mono text-sm font-medium text-payment">
            {totalSpent}
          </span>
        </div>
        <span className="text-muted-foreground/20">·</span>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-sm font-medium text-foreground/80">
            {apiCalls}
          </span>
          <span className="text-xs font-semibold tracking-widist text-muted-foreground/50 uppercase">
            APIs called
          </span>
        </div>
        {onClear && (
          <>
            <span className="text-muted-foreground/20">·</span>
            <button
              onClick={onClear}
              className="flex items-center gap-1.5 rounded-full border border-transparent px-2.5 py-0.5 font-mono text-xs text-muted-foreground/60 transition-colors hover:border-border hover:bg-muted hover:text-foreground"
            >
              <ArrowCounterClockwiseIcon size={11} weight="bold" />
              Reset session
            </button>
          </>
        )}
      </div>
    </div>
  )
}
