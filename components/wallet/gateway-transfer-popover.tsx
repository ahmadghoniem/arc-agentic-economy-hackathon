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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function GatewayTransferPopover() {
  const [tab, setTab] = React.useState("deposit")

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full text-muted-foreground hover:bg-card hover:text-foreground"
          />
        }
      >
        <ArrowsDownUpIcon size={16} weight="bold" />
        <span className="sr-only">Open gateway transfer</span>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="center"
        sideOffset={10}
        className="w-60 gap-3 border border-divider bg-card p-0 text-foreground"
      >
        <Tabs value={tab} onValueChange={setTab} className="gap-0">
          <TabsList
            variant="line"
            className="grid h-9 w-full grid-cols-2 border-b border-divider"
          >
            <TabsTrigger value="deposit">Deposit</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          </TabsList>
          <div className="space-y-2.5 p-3">
            <div className="flex items-center gap-2">
              <Input
                placeholder="0.00"
                className="h-8 flex-1 border-divider bg-background font-mono text-foreground focus-visible:border-primary"
              />
              <Button
                type="button"
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {tab === "deposit" ? "Deposit" : "Withdraw"}
              </Button>
            </div>
            <p className="text-center text-[10px] leading-relaxed text-muted-foreground">
              {tab === "deposit" ? "EOA -> Gateway" : "Gateway -> Circle"}
            </p>
          </div>
        </Tabs>
      </PopoverContent>
    </Popover>
  )
}
