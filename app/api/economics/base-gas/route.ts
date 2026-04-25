import { NextResponse } from "next/server"

type RpcResult = {
  jsonrpc: "2.0"
  id: number
  result?: string
  error?: {
    code: number
    message: string
  }
}

function hexToBigInt(value: string) {
  return BigInt(value.startsWith("0x") ? value : `0x${value}`)
}

async function fetchBaseGasPriceWei() {
  const res = await fetch("https://mainnet.base.org", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_gasPrice",
      params: [],
    }),
    cache: "no-store",
  })

  const payload = (await res.json().catch(() => null)) as RpcResult | null
  if (!res.ok || !payload?.result) {
    throw new Error(
      payload?.error?.message || `Base gas RPC failed: ${res.status} ${res.statusText}`
    )
  }

  return hexToBigInt(payload.result)
}

async function fetchEthUsdPrice() {
  const res = await fetch("https://api.coinbase.com/v2/prices/ETH-USD/spot", {
    cache: "no-store",
  })
  const payload = (await res.json().catch(() => null)) as
    | { data?: { amount?: string } }
    | null

  const amount = Number(payload?.data?.amount)
  if (!res.ok || !Number.isFinite(amount) || amount <= 0) {
    throw new Error("Failed to fetch ETH/USD spot price")
  }

  return amount
}

function formatUsd(value: number) {
  return `$${value.toFixed(4)}`
}

export async function GET() {
  try {
    const [gasPriceWei, ethUsd] = await Promise.all([
      fetchBaseGasPriceWei(),
      fetchEthUsdPrice(),
    ])

    const referenceGasUnits = 200_000
    const gasPriceEth = Number(gasPriceWei) / 1e18
    const referenceTxCostEth = gasPriceEth * referenceGasUnits
    const referenceTxCostUsd = referenceTxCostEth * ethUsd

    return NextResponse.json({
      success: true,
      data: {
        network: "Base Mainnet",
        rpcUrl: "https://mainnet.base.org",
        gasPriceWei: gasPriceWei.toString(),
        gasPriceGwei: gasPriceEth * 1e9,
        ethUsd,
        referenceGasUnits,
        referenceTxCostEth,
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
