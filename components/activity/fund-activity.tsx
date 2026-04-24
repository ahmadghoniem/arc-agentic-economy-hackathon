"use client"

import { ArrowDown, ArrowUp } from "@phosphor-icons/react"

import { fundActivity } from "@/components/activity/activity-data"
import { CopyButton, StatusDot } from "@/components/shared/shared"
import { cn } from "@/lib/utils"

export function FundActivity() {
  return (
    <section>
      <h2 className="mb-4 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
        Fund Activity
      </h2>
      <div className="flex flex-col gap-3">
        {fundActivity.map((activity) => {
          const isDeposit = activity.type === "Deposit"
          const amount = (activity.rawAmount / 1000000).toFixed(2)
          const DirectionIcon = isDeposit ? ArrowDown : ArrowUp

          return (
            <div key={activity.hash} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <div className="flex min-w-0 items-center gap-1.5">
                  <DirectionIcon
                    size={14}
                    className={
                      isDeposit ? "text-payment" : "text-muted-foreground"
                    }
                  />
                  <span className="text-sm text-foreground">
                    {activity.type}
                  </span>
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
                  className={cn("ml-2 flex-none font-mono text-xs", {
                    "text-payment": isDeposit,
                    "text-muted-foreground": !isDeposit,
                  })}
                >
                  {isDeposit ? "+" : "-"}
                  {amount} USDC
                </span>
              </div>
              <div className="flex items-center justify-between pl-[22px]">
                <div className="flex items-center gap-1">
                  <span className="font-mono text-xs text-muted-foreground">
                    {activity.hash}
                  </span>
                  <CopyButton value={activity.hash} label="Copy hash" />
                </div>
                <span className="text-xs text-muted-foreground">
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
