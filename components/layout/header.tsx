"use client"

import * as React from "react"
import {
  ArrowsClockwiseIcon,
  CurrencyCircleDollarIcon,
} from "@phosphor-icons/react"

import { SystemsPopover } from "@/components/services/systems-popover"
import { GatewayBalanceControl } from "@/components/wallet/gateway-balance-control"
import { WalletBalanceBadge } from "@/components/wallet/wallet-balance-badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  formatAtomicAmount,
  useOmniClawStore,
} from "@/lib/stores/omniclaw-store"
import { cn } from "@/lib/utils"

export function Header() {
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const account = useOmniClawStore((state) => state.account)
  const refreshConnection = useOmniClawStore(
    (state) => state.refreshConnection
  )
  const refreshAccount = useOmniClawStore((state) => state.refreshAccount)
  const refreshTransactions = useOmniClawStore(
    (state) => state.refreshTransactions
  )

  React.useEffect(() => {
    void refreshConnection()
    void refreshAccount()
    void refreshTransactions()
  }, [refreshAccount, refreshConnection, refreshTransactions])

  const refreshBalances = () => {
    setIsRefreshing(true)
    Promise.all([refreshConnection(), refreshAccount(), refreshTransactions()])
      .catch(() => undefined)
      .finally(() => setIsRefreshing(false))
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
          <WalletBalanceBadge
            label="EOA"
            amount={formatAtomicAmount(account.eoaUsdcBalanceAtomic, 3)}
            copyValue={account.eoaAddress ?? undefined}
          />
          <WalletBalanceBadge
            label="Circle"
            amount={account.circleWalletBalance || "0.00"}
            copyValue={account.circleWalletAddress ?? undefined}
            icon={
              <CurrencyCircleDollarIcon
                size={17}
                weight="duotone"
                className="flex-none text-muted-foreground/70"
              />
            }
          />
          <GatewayBalanceControl
            label="Gateway"
            amount={formatAtomicAmount(account.gatewayBalanceAtomic)}
          />
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
      <div className="flex w-65 flex-none items-center justify-end">
        <SystemsPopover />
      </div>
    </header>
  )
}
