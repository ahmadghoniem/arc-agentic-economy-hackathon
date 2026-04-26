import { NextResponse } from "next/server"

const BACKEND_URL = process.env.OMNICLAW_BACKEND_URL || "http://localhost:8090"
const EXPLORER_URL =
  process.env.NEXT_PUBLIC_ARC_EXPLORER_URL || "https://testnet.arcscan.app"
const TIMEOUT_MS = 8000

function toAtomic(usdcLike: unknown): number {
  const text = String(usdcLike ?? "").trim()
  if (!text) return 0
  const numeric = Number.parseFloat(text.replace(/[^0-9.\-]/g, ""))
  if (!Number.isFinite(numeric)) return 0
  return Math.max(0, Math.round(numeric * 1_000_000))
}

export async function GET() {
  try {
    const fetchWithTimeout = async (url: string) => {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
      try {
        return await fetch(url, { cache: "no-store", signal: controller.signal })
      } finally {
        clearTimeout(timer)
      }
    }

    const balanceRes = await fetchWithTimeout(`${BACKEND_URL}/balance`)

    const balancePayload = (await balanceRes.json().catch(() => ({}))) as {
      ok?: boolean
      error?: string
      data?: Record<string, unknown>
    }
    if (!balanceRes.ok || !balancePayload.ok) {
      throw new Error(balancePayload.error || `Backend error (${balanceRes.status})`)
    }

    const balanceData = balancePayload.data || {}
    const balances = (balanceData.balances as Record<string, unknown>) || {}
    const eoaAtomic = toAtomic(balances.eoa_usdc)
    let txItems: Array<Record<string, unknown>> = []

    try {
      const txRes = await fetchWithTimeout(`${BACKEND_URL}/transactions`)
      const txPayload = (await txRes.json().catch(() => ({}))) as {
        ok?: boolean
        data?: { items?: Array<Record<string, unknown>> }
      }
      if (txRes.ok && txPayload.ok) {
        txItems = txPayload.data?.items || []
      }
    } catch {
      txItems = []
    }

    const gatewayDeposits = txItems
      .filter((tx) => String(tx.direction || "").toLowerCase() === "deposit")
      .map((tx) => {
        const txHash = String(tx.tx_hash || "")
        const arcscanUrl =
          String(tx.arcscan_url || "") ||
          (txHash ? `${EXPLORER_URL}/tx/${txHash}` : "")
        return {
          transactionHash: txHash,
          blockNumber: null,
          timestamp: String(tx.created_at || new Date().toISOString()),
          amountAtomic: toAtomic(tx.amount),
          amountDisplay: `${(toAtomic(tx.amount) / 1_000_000).toFixed(6)} USDC`,
          fromAddress: String(tx.source || ""),
          toAddress: String(tx.destination || ""),
          explorerUrl: arcscanUrl,
        }
      })

    return NextResponse.json({
      success: true,
      data: {
        eoaAddress: balanceData.eoa_address || null,
        explorer: {
          eoaUsdcBalanceAtomic: eoaAtomic,
          eoaUsdcBalanceDisplay: `${(eoaAtomic / 1_000_000).toFixed(6)} USDC`,
          gatewayDeposits,
        },
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Explorer fetch failed",
        timestamp: new Date().toISOString(),
      },
      { status: 502 }
    )
  }
}
