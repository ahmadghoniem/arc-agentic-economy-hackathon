"use client"

import { CopyButton } from "@/components/ui/copy-button"
import { relativeTime } from "@/components/activity/activity-utils"
import { useOmniClawStore } from "@/lib/stores/omniclaw-store"
import { cn } from "@/lib/utils"

export function Withdrawals() {
  const withdrawals = useOmniClawStore((state) => state.activity.withdrawals)

  if (withdrawals.length === 0) {
    return (
      <p className="px-2 py-3 text-xs text-muted-foreground/60">
        No withdrawals in this session.
      </p>
    )
  }

  return (
    <div className="space-y-0.5">
      {withdrawals.map((activity) => {
        const isPending = activity.status !== "completed"

        return (
          <div
            key={activity.id}
            className="group flex items-center gap-2.5 rounded-md px-2 py-2 transition-colors hover:bg-card"
          >
            {/* Label + hash */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-foreground/80">Withdraw</span>
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    isPending ? "animate-pulse bg-pending" : "bg-success"
                  )}
                />
              </div>
              <div className="mt-0.5 flex items-center gap-1">
                <span className="font-mono text-xs text-muted-foreground/50">
                  {activity.transactionId}
                </span>
                <CopyButton
                  value={activity.transactionId}
                  label="Copy transaction id"
                />
              </div>
            </div>

            {/* Amount + time */}
            <div className="flex-none text-right">
              <p className="font-mono text-xs font-medium text-muted-foreground">
                -{activity.amountDisplay}
              </p>
              <p className="text-xs text-muted-foreground/50">
                {relativeTime(activity.createdAt)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
