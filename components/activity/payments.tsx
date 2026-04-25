"use client"

import { apiPayments } from "@/components/activity/activity-data"
import { StatusDot } from "@/components/shared/shared"

export function Payments() {
  return (
    <section>
      <div className="flex flex-col gap-3">
        {apiPayments.map((tx) => (
          <div key={`${tx.service}-${tx.time}`} className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <div className="flex min-w-0 items-center gap-1.5">
                <StatusDot
                  className={
                    tx.status === "completed" ? "bg-success" : "bg-pending"
                  }
                  pulse={tx.status !== "completed"}
                />
                <span className="truncate text-foreground">{tx.service}</span>
              </div>
              <span className="ml-2 flex-none font-mono text-sm text-payment">
                ${tx.amount}
              </span>
            </div>
            <div className="flex items-center justify-between pl-[14px]">
              <span className="font-mono text-sm text-muted-foreground">
                {tx.hash ?? "-"}
              </span>
              <span className="text-sm text-muted-foreground">{tx.time}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
