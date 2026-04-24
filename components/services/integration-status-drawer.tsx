"use client"

import * as React from "react"
import {
  CaretDown,
  CaretUp,
  CheckCircle,
  WifiHigh,
  XCircle,
} from "@phosphor-icons/react"

import { cn } from "@/lib/utils"

const integrationRows = [
  {
    label: "Mode",
    value: "server",
    status: "success",
  },
  {
    label: "Auth",
    value: "enabled",
    status: "success",
  },
  {
    label: "OmniClaw configured",
    value: "",
    status: "success",
  },
  {
    label: "AI (Featherless)",
    value: "",
    status: "muted",
  },
]

export function IntegrationStatusDrawer() {
  const [isOpen, setIsOpen] = React.useState(true)
  const ToggleIcon = isOpen ? CaretDown : CaretUp

  return (
    <section className="border-t border-divider bg-background px-4 py-3">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="flex items-center gap-2 text-xs font-medium text-foreground">
          <WifiHigh size={14} weight="bold" className="text-success" />
          Integration Status
        </span>
        <ToggleIcon size={13} className="text-muted-foreground" />
      </button>

      {isOpen ? (
        <div className="mt-3 border-t border-divider pt-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">OmniClaw</h3>
            <CheckCircle size={14} weight="fill" className="text-success" />
          </div>
          <div className="space-y-2">
            {integrationRows.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-3 text-xs"
              >
                <span className="min-w-0 truncate text-muted-foreground">
                  {row.label}
                </span>
                <span className="flex shrink-0 items-center gap-2 font-mono text-foreground">
                  {row.value ? row.value : null}
                  {row.value ? null : <StatusIcon status={row.status} />}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}

function StatusIcon({ status }: { status: string }) {
  if (status === "success") {
    return <CheckCircle size={13} weight="fill" className="text-success" />
  }

  return <XCircle size={13} className={cn("text-muted-foreground")} />
}
