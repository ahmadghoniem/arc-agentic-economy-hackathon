"use client"

export function SessionTopbar({
  sessionTitle,
  totalSpent,
  apiCalls,
}: {
  sessionTitle: string
  totalSpent: string
  apiCalls: number
}) {
  return (
    <div className="flex h-11 shrink-0 items-center justify-between gap-4 border-b border-divider px-6">
      <h2 className="truncate text-sm font-medium text-foreground/70">
        {sessionTitle}
      </h2>
      <div className="flex shrink-0 items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold tracking-widest text-muted-foreground/50 uppercase">
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
          <span className="text-xs font-semibold tracking-widest text-muted-foreground/50 uppercase">
            APIs called
          </span>
        </div>
      </div>
    </div>
  )
}
