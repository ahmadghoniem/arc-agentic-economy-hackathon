"use client"

import { ArrowSquareOutIcon } from "@phosphor-icons/react"

import { CopyButton } from "@/components/shared/shared"
import { formatTruncatedHash } from "@/components/activity/activity-utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useOmniClawStore } from "@/lib/stores/omniclaw-store"
import { cn } from "@/lib/utils"

function relativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.max(1, Math.round(diff / 60000))
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

export function Deposits() {
  const deposits = useOmniClawStore((state) => state.activity.deposits)
  const explorerDeposits = useOmniClawStore(
    (state) => state.activity.explorerDeposits
  )

  if (deposits.length === 0 && explorerDeposits.length === 0) {
    return (
      <p className="px-2 py-3 text-xs text-muted-foreground/60">
        No deposits available yet.
      </p>
    )
  }

  return <div className="space-y-4">
    {explorerDeposits.length > 0 ? (
      <div className="space-y-2">
        <div className="space-y-px">
          {explorerDeposits.map((deposit) => (
            <div
              key={deposit.transactionHash}
              className="group flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-card"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-foreground/80">Deposit</span>
                  <span className="size-1.5 rounded-full bg-success" />
                </div>
                <div className="mt-0.5 flex items-center gap-0.5">
                  <span
                    className="min-w-0 truncate font-mono text-xs text-muted-foreground/50"
                    title={deposit.transactionHash}
                  >
                    {formatTruncatedHash(deposit.transactionHash)}
                  </span>
                  <CopyButton
                    value={deposit.transactionHash}
                    label="Copy transaction hash"
                  />
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <a
                          href={deposit.explorerUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-0.5 text-muted-foreground transition-colors hover:text-foreground"
                          aria-label="View on Arcscan"
                        />
                      }
                    >
                      <ArrowSquareOutIcon size={16} weight="bold" />
                    </TooltipTrigger>
                    <TooltipContent>View on Arcscan</TooltipContent>
                  </Tooltip>
                </div>
              </div>

              <div className="flex-none text-right">
                <p className="font-mono text-xs font-medium text-payment">
                  +{deposit.amountDisplay}
                </p>
                <p className="text-xs text-muted-foreground/50">
                  {relativeTime(deposit.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ) : null}

    {deposits.length > 0 ? (
      <div className="space-y-2">
        <p className="px-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
          Session deposits
        </p>
        <div className="space-y-px">
          {deposits.map((activity) => {
            const isPending = activity.status !== "completed"

            return (
              <div
                key={activity.id}
                className="group flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-card"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-foreground/80">Deposit</span>
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        isPending ? "animate-pulse bg-pending" : "bg-success"
                      )}
                    />
                  </div>
                  <div className="mt-0.5 flex items-center gap-1">
                    <span
                      className="min-w-0 truncate font-mono text-xs text-muted-foreground/50"
                      title={activity.transactionId}
                    >
                      {formatTruncatedHash(activity.transactionId)}
                    </span>
                    <CopyButton
                      value={activity.transactionId}
                      label="Copy transaction id"
                    />
                  </div>
                </div>

                <div className="flex-none text-right">
                  <p className="font-mono text-xs font-medium text-payment">
                    +{activity.amountDisplay}
                  </p>
                  <p className="text-xs text-muted-foreground/50">
                    {relativeTime(activity.createdAt)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    ) : null}
  </div>
}
