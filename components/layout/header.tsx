"use client"

import * as React from "react"
import { ArrowsClockwiseIcon, SidebarSimpleIcon } from "@phosphor-icons/react"

import { GatewayTransferPopover } from "@/components/wallet/gateway-transfer-popover"
import { walletBalances } from "@/components/wallet/wallet-data"
import { WalletBalanceBadge } from "@/components/wallet/wallet-balance-badge"
import { Button } from "@/components/ui/button"
import { SheetTrigger } from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export function Header() {
  const [isRefreshing, setIsRefreshing] = React.useState(false)

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

      <div className="hidden items-center gap-2 lg:flex">
        {walletBalances.map((wallet) => (
          <WalletBalanceBadge key={wallet.label} {...wallet} />
        ))}
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
        <GatewayTransferPopover />
      </div>

      <div className="flex w-60 items-center justify-end gap-2">
        <SheetTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 border-divider bg-transparent text-muted-foreground hover:bg-card hover:text-foreground"
            />
          }
        >
          <SidebarSimpleIcon size={16} />
          Browse APIs
        </SheetTrigger>
      </div>
    </header>
  )
}
