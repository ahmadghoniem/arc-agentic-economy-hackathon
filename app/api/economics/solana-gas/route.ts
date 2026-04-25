import { NextResponse } from "next/server"

/**
 * Solana's base fee is a protocol constant: 5,000 lamports per signature.
 * @see https://solana.com/docs/core/fees
 */
const BASE_FEE_LAMPORTS = 5_000
const LAMPORTS_PER_SOL = 1_000_000_000

async function fetchSolUsdPrice() {
  const res = await fetch("https://api.coinbase.com/v2/prices/SOL-USD/spot", {
    cache: "no-store",
  })
  const payload = (await res.json().catch(() => null)) as
    | { data?: { amount?: string } }
    | null

  const amount = Number(payload?.data?.amount)
  if (!res.ok || !Number.isFinite(amount) || amount <= 0) {
    throw new Error("Failed to fetch SOL/USD spot price")
  }

  return amount
}

function formatUsd(value: number) {
  return `$${value.toFixed(4)}`
}

export async function GET() {
  try {
    const solUsd = await fetchSolUsdPrice()

    const referenceTxCostSol = BASE_FEE_LAMPORTS / LAMPORTS_PER_SOL
    const referenceTxCostUsd = referenceTxCostSol * solUsd

    return NextResponse.json({
      success: true,
      data: {
        network: "Solana Mainnet",
        lamportsPerSignature: BASE_FEE_LAMPORTS,
        solUsd,
        referenceTxCostSol,
        referenceTxCostUsd,
        displayCost: formatUsd(referenceTxCostUsd),
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 502 }
    )
  }
}
