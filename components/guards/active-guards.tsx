"use client"

import {
  ArrowsHorizontalIcon,
  ShieldCheckIcon,
  UsersThreeIcon,
  WalletIcon,
  type Icon,
} from "@phosphor-icons/react"

import type { GuardIcon } from "@/components/guards/types"
import { useOmniClawStore } from "@/lib/stores/omniclaw-store"
import { cn } from "@/lib/utils"

const guardIcons: Record<GuardIcon, Icon> = {
  wallet: WalletIcon,
  "arrows-horizontal": ArrowsHorizontalIcon,
  "users-three": UsersThreeIcon,
  "shield-check": ShieldCheckIcon,
}

export function ActiveGuards() {
  const policy = useOmniClawStore((state) => state.account.policy)
  const guardItems = [
    {
      id: "daily-budget",
      icon: "wallet" as GuardIcon,
      label: "Daily Budget",
      value: policy.dailyMax ? `$${policy.dailyMax}` : "N/A",
      helper: "Policy limit from OmniClaw wallet config",
      progress: undefined,
    },
    {
      id: "rate-limit",
      icon: "arrows-horizontal" as GuardIcon,
      label: "Rate Limit",
      value: policy.perMinute ? `${policy.perMinute} req/min` : "N/A",
      helper: "Request frequency restriction from policy",
      progress: undefined,
    },
    {
      id: "recipients",
      icon: "users-three" as GuardIcon,
      label: "Recipients",
      value: policy.recipientsMode ?? "N/A",
      helper: policy.recipientDomains.length
        ? policy.recipientDomains.join(", ")
        : "Allowed recipient policy mode",
      progress: undefined,
    },
    {
      id: "manual-review",
      icon: "shield-check" as GuardIcon,
      label: "Review Threshold",
      value: policy.confirmThreshold ?? "N/A",
      helper: "Approval threshold from wallet policy",
      progress: undefined,
    },
  ]

  return (
    <section className="p-3">
      {/* Section label */}
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Active Guards
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
                    size={18}
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
