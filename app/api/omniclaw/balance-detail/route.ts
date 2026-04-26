import { NextResponse } from "next/server"

const BACKEND_URL = process.env.OMNICLAW_BACKEND_URL || "http://localhost:8090"

function toAtomic(usdcLike: unknown): number {
  const text = String(usdcLike ?? "").trim()
  if (!text) return 0
  const numeric = Number.parseFloat(text.replace(/[^0-9.\-]/g, ""))
  if (!Number.isFinite(numeric)) return 0
  return Math.max(0, Math.round(numeric * 1_000_000))
}

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/balance`, {
      method: "GET",
      cache: "no-store",
    })
    const payload = (await res.json().catch(() => ({}))) as {
      ok?: boolean
      error?: string
      data?: Record<string, unknown>
    }
    if (!res.ok || !payload.ok) {
      throw new Error(payload.error || `Backend error (${res.status})`)
    }

    const data = payload.data || {}
    const balances = (data.balances as Record<string, unknown>) || {}
    const gatewayAtomic = toAtomic(balances.gateway_usdc)
    const eoaAtomic = toAtomic(balances.eoa_usdc)

    return NextResponse.json({
      success: true,
      data: {
        wallet_id: data.wallet_id || null,
        eoa_address: data.eoa_address || null,
        payment_address: data.eoa_address || null,
        circle_wallet_address: data.wallet_address || null,
        circle_wallet_balance: balances.circle_wallet_usdc || null,
        gateway_balance_atomic: gatewayAtomic,
        gateway_onchain_balance_atomic: gatewayAtomic,
        eoa_balance_atomic: eoaAtomic,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Balance fetch failed",
        timestamp: new Date().toISOString(),
      },
      { status: 502 }
    )
  }
}
