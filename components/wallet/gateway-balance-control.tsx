"use client"

import * as React from "react"
import { ArrowsDownUpIcon } from "@phosphor-icons/react"

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
    <div className="flex h-8 items-center overflow-hidden rounded-full border border-divider bg-card">
      <div className="flex h-full items-center px-3">
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
        <span className="ml-1 font-mono text-sm text-payment">{amount}</span>
      </div>
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
          <ArrowsDownUpIcon size={16} weight="bold" />
          <span className="sr-only">Open gateway transfer</span>
        </PopoverTrigger>
        <PopoverContent
          side="bottom"
          align="end"
          sideOffset={9}
          className="w-95 rounded-t-none border-x border-t-0 border-b border-divider bg-background px-3 py-2 text-foreground shadow-xl"
        >
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-divider bg-card p-0.5">
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
              className="h-8 w-20 flex-1 border-divider bg-card px-2.5 py-1 font-mono text-xl text-foreground focus-visible:border-primary"
            />
            <Button
              type="button"
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              submit
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {activeTab === "deposit"
              ? "Moves USDC from EOA wallet to your Gateway balance."
              : "Moves USDC from Gateway balance to your Circle wallet."}
          </p>
        </PopoverContent>
      </Popover>
    </div>
  )
}
