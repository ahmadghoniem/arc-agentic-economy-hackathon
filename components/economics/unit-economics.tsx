"use client"

import * as React from "react"
import { ArrowSquareOutIcon } from "@phosphor-icons/react"

const FALLBACK_BASE_GAS_COST = "~$0.0020"
const FALLBACK_SOLANA_GAS_COST = "~$0.0004"
const NANO_PAYMENT_VALUE = 0.00044

type GasEstimate = {
  displayCost: string
  referenceTxCostUsd: number
}

function useGasEstimate(path: string) {
  const [estimate, setEstimate] = React.useState<GasEstimate | null>(null)

  React.useEffect(() => {
    const controller = new AbortController()

    async function load() {
      try {
        const res = await fetch(path, {
          cache: "no-store",
          signal: controller.signal,
        })
        const payload = (await res.json().catch(() => null)) as {
          success?: boolean
          data?: GasEstimate
        } | null
        if (res.ok && payload?.success && payload.data) {
          setEstimate(payload.data)
        }
      } catch {
        // Keep fallback values if the live estimate is unavailable.
      }
    }

    void load()
    return () => controller.abort()
  }, [path])

  return estimate
}

function gasMetrics(estimate: GasEstimate | null, fallbackOverhead: string) {
  const ratio = estimate ? estimate.referenceTxCostUsd / NANO_PAYMENT_VALUE : 0

  return {
    ratio,
    percent: Math.min(100, Math.max(1, Math.round(ratio * 100))),
    overhead:
      estimate && estimate.referenceTxCostUsd > 0
        ? (ratio * 100).toFixed(0)
        : fallbackOverhead,
  }
}

export function UnitEconomics() {
  const gasEstimate = useGasEstimate("/api/economics/base-gas")
  const solanaEstimate = useGasEstimate("/api/economics/solana-gas")

  const liveGasCost = gasEstimate?.displayCost || FALLBACK_BASE_GAS_COST
  const liveSolanaCost = solanaEstimate?.displayCost || FALLBACK_SOLANA_GAS_COST
  const base = gasMetrics(gasEstimate, "0")
  const solana = gasMetrics(solanaEstimate, "~91")

  const gatewayRawPercent = 0
  const solanaRawPercent = solana.ratio * 100
  const baseRawPercent = base.ratio * 100

  const maxRaw = Math.max(
    gatewayRawPercent,
    solanaRawPercent,
    baseRawPercent,
    1
  )

  const marginRows = [
    {
      label: "Gateway cost per call",
      cost: "Gasless",
      percent: 0,
      barWidth: (gatewayRawPercent / maxRaw) * 100,
      tone: "bg-success",
    },
    {
      label: "Solana L1 fee per call",
      cost: liveSolanaCost,
      percent: solana.percent,
      overhead: solana.overhead,
      barWidth: (solanaRawPercent / maxRaw) * 100,
      tone: "bg-pending",
    },
    {
      label: "Base L2 gas per call",
      cost: liveGasCost,
      percent: base.percent,
      overhead: base.overhead,
      barWidth: (baseRawPercent / maxRaw) * 100,
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
                {row.label === "Solana L1 fee per call" ? (
                  <a
                    href="https://explorer.solana.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-0.5 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label="Open Solana Explorer"
                    title="Open Solana Explorer"
                  >
                    <ArrowSquareOutIcon size={12} weight="bold" />
                  </a>
                ) : row.label === "Base L2 gas per call" ? (
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
                {"overhead" in row ? row.overhead : row.percent}
                %)
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${row.tone}`}
                style={{ width: `${row.barWidth}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-xs leading-4 text-muted-foreground/70">
        <p>Per-call L2 & L1 gas inevitably kills sub-cent pricing</p>
        <p>Circle Gateway batches signatures off-chain.</p>
        <p>making micropayments economically viable.</p>
      </div>
    </section>
  )
}
