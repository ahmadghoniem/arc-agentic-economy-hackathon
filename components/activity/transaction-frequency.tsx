"use client"

import { useMemo } from "react"

import { useOmniClawStore } from "@/lib/stores/omniclaw-store"

const TARGET_ONCHAIN_TX = 50

function isOnchainPayment(transactionId: string, arcscanUrl?: string) {
  if (arcscanUrl) return true
  return /^0x[a-fA-F0-9]{64}$/.test(transactionId)
}

export function TransactionFrequency() {
  const payments = useOmniClawStore((state) => state.activity.payments)

  const stats = useMemo(() => {
    const now = Date.now()
    const oneHourAgo = now - 60 * 60 * 1000

    const onchain = payments.filter((entry) =>
      isOnchainPayment(entry.transactionId, entry.arcscanUrl)
    )
    const inLastHour = onchain.filter((entry) => {
      const ts = new Date(entry.createdAt).getTime()
      return Number.isFinite(ts) && ts >= oneHourAgo
    })

    const onchainCount = onchain.length
    const txPerHour = inLastHour.length
    const progressToTarget = Math.min(
      100,
      Math.round((onchainCount / TARGET_ONCHAIN_TX) * 100)
    )

    return { onchainCount, txPerHour, progressToTarget }
  }, [payments])

  return (
    <section className="mb-3 rounded-xl border border-divider bg-card p-3">
      <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        Transaction Frequency
      </h3>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Onchain tx observed</p>
          <p className="mt-0.5 font-mono text-2xl text-foreground">
            {stats.onchainCount}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Last hour</p>
          <p className="mt-0.5 font-mono text-2xl text-foreground">
            {stats.txPerHour}
            <span className="ml-1 text-sm text-muted-foreground">tx/h</span>
          </p>
        </div>
      </div>

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>Demo target: 50+ onchain transactions</span>
          <span>{stats.progressToTarget}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-payment transition-all"
            style={{ width: `${stats.progressToTarget}%` }}
          />
        </div>
      </div>
    </section>
  )
}
