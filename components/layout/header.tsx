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
    <header className="relative z-20 flex h-13 flex-none items-center justify-between border-b border-divider bg-background px-4">
      <div className="flex w-60 items-center gap-3">
        <h1 className="font-semibold tracking-wide text-foreground">
          OmniClaw Console
        </h1>
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-primary" />
        </span>
      </div>

      <div className="hidden items-center gap-6 lg:flex">
        {eoaBalance ? <WalletBalanceBadge {...eoaBalance} /> : null}
        {gatewayBalance ? (
          <GatewayBalanceControl
            label={gatewayBalance.label}
            amount={gatewayBalance.amount}
          />
        ) : null}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={isRefreshing}
                onClick={refreshBalances}
                className="rounded-full text-muted-foreground hover:bg-card hover:text-foreground"
              />
            }
          >
            <ArrowsClockwiseIcon
              size={16}
              weight="bold"
              className={cn(isRefreshing && "animate-spin")}
            />
            <span className="sr-only">Refresh balances</span>
          </TooltipTrigger>
          <TooltipContent>Refresh balances</TooltipContent>
        </Tooltip>
      </div>

      <div className="flex w-60 items-center justify-end gap-2">
        <SystemsPopover />
      </div>
    </header>
  )
}
