"use client"

import { ArrowUpIcon } from "@phosphor-icons/react"

import { withdrawalActivity } from "@/components/activity/activity-data"
import { CopyButton } from "@/components/shared/shared"
import { cn } from "@/lib/utils"

export function Withdrawals() {
  return (
    <div className="space-y-px">
      {withdrawalActivity.map((activity) => {
        const amount = (activity.rawAmount / 1000000).toFixed(2)
        const isPending = activity.status !== "completed"

        return (
          <div
            key={activity.hash}
            className="group flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-card"
          >
            {/* Direction icon */}
            <ArrowUpIcon
              size={12}
              weight="bold"
              className="mt-px flex-none self-start text-muted-foreground/60"
            />

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
                  {activity.hash}
                </span>
                <CopyButton value={activity.hash} label="Copy hash" />
              </div>
            </div>

            {/* Amount + time */}
            <div className="flex-none text-right">
              <p className="font-mono text-xs font-medium text-muted-foreground">
                -{amount}
              </p>
              <p className="text-xs text-muted-foreground/50">
                {activity.time}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
