"use client"

import {
  ArrowsHorizontal,
  Gauge,
  Lock,
  ShieldCheck,
  UsersThree,
  Wallet,
  type Icon,
} from "@phosphor-icons/react"

import { guardItems } from "@/components/guards/guard-data"
import type { GuardIcon } from "@/components/guards/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const guardIcons: Record<GuardIcon, Icon> = {
  wallet: Wallet,
  "arrows-horizontal": ArrowsHorizontal,
  gauge: Gauge,
  "users-three": UsersThree,
  "shield-check": ShieldCheck,
}

export function ActiveGuards() {
  return (
    <Card className="border border-divider bg-card py-4 text-card-foreground ring-0">
      <CardHeader className="px-4">
        <div className="flex items-center gap-2">
          <Lock size={12} weight="bold" className="text-success" />
          <CardTitle className="flex-1 text-xs tracking-widest text-muted-foreground uppercase">
            Active Guards
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5 px-4">
        {guardItems.map((guard) => {
          const GuardIcon = guardIcons[guard.icon]

          return (
            <div
              key={guard.id}
              className="rounded-md border border-border/80 bg-muted/25 p-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex size-5 items-center justify-center rounded-sm bg-accent/80 text-muted-foreground">
                    <GuardIcon size={12} weight="duotone" />
                  </span>
                  <span className="truncate text-[11px] font-medium text-foreground">
                    {guard.label}
                  </span>
                </div>
                <span className="font-mono text-[11px] text-payment">
                  {guard.value}
                </span>
              </div>
              {guard.progress !== undefined ? (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-accent">
                  <div
                    className={cn("h-full rounded-full", {
                      "bg-payment": guard.id === "daily-budget",
                      "bg-success": guard.id === "rate-limit",
                    })}
                    style={{ width: `${guard.progress}%` }}
                  />
                </div>
              ) : null}
              <p className="mt-1.5 text-[10px] text-muted-foreground">
                {guard.helper}
              </p>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
