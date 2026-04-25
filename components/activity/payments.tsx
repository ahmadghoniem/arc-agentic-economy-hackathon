"use client"

import { apiPayments } from "@/components/activity/activity-data"
import { cn } from "@/lib/utils"

export function Payments() {
  return (
    <div className="space-y-px">
      {apiPayments.map((tx, i) => (
        <div
          key={`${tx.service}-${tx.time}-${i}`}
          className="group flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-card"
        >
          {/* Status dot */}
          <span
            className={cn(
              "mt-px size-1.5 flex-none self-start rounded-full",
              tx.status === "completed"
                ? "bg-success"
                : "animate-pulse bg-pending"
            )}
          />

          {/* Service path + time */}
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-xs text-foreground/80">
              {tx.service}
            </p>
            <p className="text-xs text-muted-foreground/50">{tx.time}</p>
          </div>

          {/* Amount */}
          <span className="flex-none font-mono text-xs font-medium text-payment">
            ${tx.amount}
          </span>
        </div>
      ))}
    </div>
  )
}
