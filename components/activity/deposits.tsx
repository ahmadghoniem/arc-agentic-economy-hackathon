"use client"

import { ArrowDownIcon } from "@phosphor-icons/react"

import { depositActivity } from "@/components/activity/activity-data"
import { CopyButton, StatusDot } from "@/components/shared/shared"

export function Deposits() {
  return (
    <section>
      <div className="flex flex-col gap-3">
        {depositActivity.map((activity) => {
          const amount = (activity.rawAmount / 1000000).toFixed(2)

          return (
            <div key={activity.hash} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <div className="flex min-w-0 items-center gap-1.5">
                  <ArrowDownIcon size={14} className="text-payment" />
                  <span className="text-foreground">Deposit</span>
                  <StatusDot
                    className={
                      activity.status === "completed"
                        ? "bg-success"
                        : "bg-pending"
                    }
                    pulse={activity.status !== "completed"}
                  />
                </div>
                <span className="ml-2 flex-none font-mono text-sm text-payment">
                  +{amount} USDC
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
