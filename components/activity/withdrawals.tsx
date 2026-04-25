"use client"

import { ArrowUpIcon } from "@phosphor-icons/react"

import { withdrawalActivity } from "@/components/activity/activity-data"
import { CopyButton, StatusDot } from "@/components/shared/shared"
import { cn } from "@/lib/utils"

export function Withdrawals() {
  return (
    <section>
      <div className="flex flex-col gap-3">
        {withdrawalActivity.map((activity) => {
          const amount = (activity.rawAmount / 1000000).toFixed(2)

          return (
            <div key={activity.hash} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <div className="flex min-w-0 items-center gap-1.5">
                  <ArrowUpIcon size={14} className="text-muted-foreground" />
                  <span className="text-foreground">Withdrawal</span>
                  <StatusDot
                    className={
                      activity.status === "completed"
                        ? "bg-success"
                        : "bg-pending"
                    }
                    pulse={activity.status !== "completed"}
                  />
                </div>
                <span
                  className={cn(
                    "ml-2 flex-none font-mono text-sm text-muted-foreground"
                  )}
                >
                  -{amount} USDC
                </span>
              </div>
              <div className="flex items-center justify-between pl-5.5">
                <div className="flex items-center gap-1">
                  <span className="font-mono text-sm text-muted-foreground">
                    {activity.hash}
                  </span>
                  <CopyButton value={activity.hash} label="Copy hash" />
                </div>
                <span className="text-sm text-muted-foreground">
                  {activity.time}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
