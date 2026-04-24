"use client"

import type { ReactNode } from "react"

import { CopyButton, StatusDot } from "@/components/shared/shared"
import type { WalletBalance } from "@/components/wallet/types"

export function WalletBalanceBadge({
  label,
  amount,
  statusColor,
  copyValue,
  action,
}: WalletBalance & {
  action?: ReactNode
}) {
  return (
    <div className="flex h-8 items-center gap-2 rounded-full border border-divider bg-card px-3">
      <StatusDot className={statusColor} />
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="ml-1 font-mono text-xs text-payment">{amount}</span>
      {copyValue ? (
        <CopyButton value={copyValue} label={`Copy ${label}`} />
      ) : null}
      {action}
    </div>
  )
}
