"use client"

import { CopyButton } from "@/components/shared/shared"
import { formatTruncatedHash } from "@/components/activity/activity-utils"
import { useOmniClawStore } from "@/lib/stores/omniclaw-store"

function relativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.max(1, Math.round(diff / 60000))
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

export function Payments() {
  const payments = useOmniClawStore((state) => state.activity.payments)

  if (payments.length === 0) {
    return (
      <p className="px-2 py-3 text-xs text-muted-foreground/60">
        No API payments yet.
      </p>
    )
  }

  return (
    <div className="space-y-px">
      {payments.map((tx) => (
        <div
          key={tx.id}
          className="group flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-card"
        >
          {/* Service path + time */}
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-xs text-foreground/80">
              {tx.apiName}
            </p>
            <div className="mt-0.5 flex items-center gap-1">
              <span
                className="min-w-0 truncate font-mono text-xs text-muted-foreground/50"
                title={tx.transactionId}
              >
                {formatTruncatedHash(tx.transactionId)}
              </span>
              <CopyButton
                value={tx.transactionId}
                label="Copy transaction id"
              />
            </div>
          </div>

          {/* Amount */}
          <div className="flex-none text-right">
            <p className="font-mono text-xs font-medium text-payment">
              {tx.amountDisplay}
            </p>
            <p className="text-xs text-muted-foreground/50">
              {relativeTime(tx.createdAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
