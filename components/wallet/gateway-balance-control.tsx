"use client"

import * as React from "react"
import {
  ArrowsDownUpIcon,
  PaperPlaneRightIcon,
  VaultIcon,
} from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type GatewayBalanceControlProps = {
  amount: string
  label?: string
}

export function GatewayBalanceControl({
  amount,
  label = "Gateway",
}: GatewayBalanceControlProps) {
  const [activeTab, setActiveTab] = React.useState<"deposit" | "withdraw">(
    "deposit"
  )
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <div className="flex h-8 items-center overflow-hidden rounded-lg border border-divider bg-card">
      {/* Label + amount */}
      <div className="flex h-full items-center gap-2 px-2">
        <VaultIcon
          size={17}
          weight="duotone"
          className="flex-none text-muted-foreground/70"
        />
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
        <span className="font-mono text-sm text-payment">{amount} USDC</span>
      </div>

      {/* Trigger button */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 rounded-none border-l border-divider text-muted-foreground hover:bg-card hover:text-foreground"
            />
          }
        >
          <ArrowsDownUpIcon size={14} weight="bold" />
          <span className="sr-only">Open gateway transfer</span>
        </PopoverTrigger>

        <PopoverContent
          side="bottom"
          align="end"
          sideOffset={6}
          className="w-96 gap-px rounded-xl border border-divider bg-card p-3 text-foreground shadow-xl"
        >
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-divider bg-background p-0.5">
              <button
                type="button"
                onClick={() => setActiveTab("deposit")}
                className={cn(
                  "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                  activeTab === "deposit"
                    ? "bg-muted text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Deposit
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("withdraw")}
                className={cn(
                  "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                  activeTab === "withdraw"
                    ? "bg-muted text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Withdraw
              </button>
            </div>
            <Input
              placeholder="0.00"
              className="h-8 flex-1 border-divider bg-background px-2.5 py-1 font-mono text-xl text-foreground focus-visible:border-primary"
            />
            <Button
              type="button"
              size="icon"
              className="size-8 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <PaperPlaneRightIcon size={16} weight="bold" />
              <span className="sr-only">Submit transfer</span>
            </Button>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {activeTab === "deposit"
              ? "Moves USDC from EOA wallet to your Gateway balance."
              : "Moves USDC from Gateway balance to your EOA wallet."}
          </p>
        </PopoverContent>
      </Popover>
    </div>
  )
}
