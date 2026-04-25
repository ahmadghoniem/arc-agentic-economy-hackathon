"use client"

import {
  ArrowsHorizontalIcon,
  GaugeIcon,
  LockSimpleIcon,
  ShieldCheckIcon,
  UsersThreeIcon,
  WalletIcon,
  type Icon,
} from "@phosphor-icons/react"

import { guardItems } from "@/components/guards/guard-data"
import type { GuardIcon } from "@/components/guards/types"
import { cn } from "@/lib/utils"

const guardIcons: Record<GuardIcon, Icon> = {
  wallet: WalletIcon,
  "arrows-horizontal": ArrowsHorizontalIcon,
  gauge: GaugeIcon,
  "users-three": UsersThreeIcon,
  "shield-check": ShieldCheckIcon,
}

export function ActiveGuards() {
  return (
    <section className="p-3">
      {/* Section label */}
      <div className="mb-2 flex items-center gap-2">
        <LockSimpleIcon size={13} weight="fill" className="text-success" />
        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Active Guards
        </span>
        <span className="ml-auto flex items-center justify-center rounded-full bg-success/15 px-1.5 py-0.5 text-xs font-bold text-success tabular-nums">
          {guardItems.length}
        </span>
      </div>

      {/* Guard rows */}
      <div className="space-y-px">
        {guardItems.map((guard, i) => {
          const GuardIcon = guardIcons[guard.icon]
          const isLast = i === guardItems.length - 1

          return (
            <div
              key={guard.id}
              className={cn(
                "group relative py-2",
                !isLast && "border-b border-divider/60"
              )}
            >
              <div className="flex items-center justify-between gap-3">
                {/* Icon + label */}
                <div className="flex min-w-0 items-center gap-2">
                  <GuardIcon
                    size={15}
                    weight="duotone"
                    className="flex-none text-muted-foreground/70"
                  />
                  <span className="truncate text-sm text-foreground/80">
                    {guard.label}
                  </span>
                </div>
                {/* Value */}
                <span className="flex-none font-mono text-sm font-medium text-payment">
                  {guard.value}
                </span>
              </div>

              {/* Progress bar */}
              {guard.progress !== undefined && (
                <div className="mt-2 h-[3px] overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      guard.id === "daily-budget" ? "bg-payment" : "bg-success"
                    )}
                    style={{ width: `${guard.progress}%` }}
                  />
                </div>
              )}

              {/* Helper */}
              <p className="mt-1 text-xs leading-none text-muted-foreground/60">
                {guard.helper}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
