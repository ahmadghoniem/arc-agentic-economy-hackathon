"use client"

import * as React from "react"
import { ArrowsClockwiseIcon } from "@phosphor-icons/react"

import { SystemsPopover } from "@/components/services/systems-popover"
import { walletBalances } from "@/components/wallet/wallet-data"
import { GatewayBalanceControl } from "@/components/wallet/gateway-balance-control"
import { WalletBalanceBadge } from "@/components/wallet/wallet-balance-badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export function Header() {
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const eoaBalance = walletBalances.find((wallet) => wallet.label === "EOA")
  const gatewayBalance = walletBalances.find(
    (wallet) => wallet.label === "Gateway"
  )

  const refreshBalances = () => {
    setIsRefreshing(true)
    window.setTimeout(() => setIsRefreshing(false), 900)
  }

  return (
    <header className="relative z-20 flex h-12 flex-none items-center border-b border-divider bg-background px-4">
      {/* Brand — left */}
      <div className="flex flex-none items-center gap-2.5">
        <h1 className="text-sm font-semibold tracking-wide text-foreground uppercase">
          Omniclaw
        </h1>
        <span className="rounded border border-divider px-1.5 py-px text-xs font-medium tracking-wider text-muted-foreground uppercase">
          Console
        </span>
      </div>

      {/* Wallet controls — center */}
      <div className="flex flex-1 items-center justify-center gap-3">
        <div className="hidden items-center gap-2 lg:flex">
          {eoaBalance ? <WalletBalanceBadge {...eoaBalance} /> : null}
          {gatewayBalance ? (
            <GatewayBalanceControl
              label={gatewayBalance.label}
              amount={gatewayBalance.amount}
            />
          ) : null}
        </div>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={isRefreshing}
                onClick={refreshBalances}
                className="size-7 rounded-full text-muted-foreground hover:bg-card hover:text-foreground"
              />
            }
          >
            <ArrowsClockwiseIcon
              size={14}
              weight="bold"
              className={cn(isRefreshing && "animate-spin")}
            />
            <span className="sr-only">Refresh balances</span>
          </TooltipTrigger>
          <TooltipContent>Refresh balances</TooltipContent>
        </Tooltip>
      </div>

      {/* Status — right */}
      <div className="flex w-[260px] flex-none items-center justify-end">
        <SystemsPopover />
      </div>
    </header>
  )
}
