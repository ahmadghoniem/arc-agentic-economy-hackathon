"use client"

import type { ReactNode } from "react"
import { WalletIcon } from "@phosphor-icons/react"

import { CopyButton } from "@/components/shared/shared"
import type { WalletBalance } from "@/components/wallet/types"

export function WalletBalanceBadge({
  label,
  amount,
  copyValue,
  action,
}: WalletBalance & {
  action?: ReactNode
}) {
  return (
    <div className="flex h-8 items-center gap-2 rounded-full border border-divider bg-card px-3">
      {/* Wallet icon */}
      <WalletIcon size={14} weight="duotone" className="flex-none text-muted-foreground/70" />
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      {/* Amount */}
      <span className="ml-1 font-mono text-sm text-payment">{amount} USDC</span>
      {copyValue ? (
        <CopyButton value={copyValue} label={`Copy ${label} address`} />
      ) : null}
      {action}
    </div>
  )
}
