"use client"

import * as React from "react"
import { ArrowSquareOutIcon } from "@phosphor-icons/react"

const FALLBACK_GATEWAY_COST = "~$0.0001"
const FALLBACK_BASE_GAS_COST = "~$0.0020"
const NANO_PAYMENT_VALUE = 0.00044

type GasEstimate = {
  displayCost: string
  referenceTxCostUsd: number
}

export function UnitEconomics() {
  const [gasEstimate, setGasEstimate] = React.useState<GasEstimate | null>(null)

  React.useEffect(() => {
    const controller = new AbortController()

    async function load() {
      try {
        const res = await fetch("/api/economics/base-gas", {
          cache: "no-store",
          signal: controller.signal,
        })
        const payload = (await res.json().catch(() => null)) as {
          success?: boolean
          data?: GasEstimate
        } | null
        if (!res.ok || !payload?.success || !payload.data) return
        setGasEstimate(payload.data)
      } catch {
        // Keep the fallback values if the live estimate is unavailable.
      }
    }

    void load()
    return () => controller.abort()
  }, [])

  const liveGasCost = gasEstimate?.displayCost || FALLBACK_BASE_GAS_COST
  const liveGasRatio = gasEstimate
    ? gasEstimate.referenceTxCostUsd / NANO_PAYMENT_VALUE
    : 0
  const liveGasPercent = Math.min(
    100,
    Math.max(1, Math.round(liveGasRatio * 100))
  )
  const liveGasOverhead =
    gasEstimate && gasEstimate.referenceTxCostUsd > 0
      ? (liveGasRatio * 100).toFixed(0)
      : "0"
  const marginRows = [
    {
      label: "Gateway cost per call",
      cost: FALLBACK_GATEWAY_COST,
      percent: 1,
      tone: "bg-success",
    },
    {
      label: "Base L2 gas per call",
      cost: liveGasCost,
      percent: liveGasPercent,
      tone: "bg-risk",
    },
  ]

  return (
    <section className="p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Unit Economics
        </span>
        <span className="font-mono text-xs font-medium text-payment">
          $0.00044 / call
        </span>
      </div>

      <div className="space-y-3">
        {marginRows.map((row) => (
          <div key={row.label}>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="flex items-center gap-1 text-xs font-medium text-foreground/80">
                {row.label}
                {row.label === "Base L2 gas per call" ? (
                  <a
                    href="https://basescan.org/gastracker"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-0.5 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label="Open Base gas tracker"
                    title="Open Base gas tracker"
                  >
                    <ArrowSquareOutIcon size={12} weight="bold" />
                  </a>
                ) : null}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                {row.cost} (
                {row.label === "Base L2 gas per call"
                  ? liveGasOverhead
                  : row.percent}
                %)
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${row.tone}`}
                style={{ width: `${row.percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-xs leading-4 text-muted-foreground/70">
        <p>Per-call L2 (ex. Base) gas inevitably kills sub-cent pricing</p>
        <p>Circle Gateway batches signatures off-chain, </p>
        <p>making micropayments economically viable.</p>
      </div>
    </section>
  )
}
