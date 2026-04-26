import { NextResponse } from "next/server"

const BACKEND_URL = process.env.OMNICLAW_BACKEND_URL || "http://localhost:8090"

export async function GET() {
  try {
    const [configRes, balanceRes] = await Promise.all([
      fetch(`${BACKEND_URL}/config/status`, { cache: "no-store" }),
      fetch(`${BACKEND_URL}/balance`, { cache: "no-store" }),
    ])

    const configPayload = (await configRes.json().catch(() => ({}))) as {
      ok?: boolean
      error?: string
      data?: Record<string, unknown>
    }
    const balancePayload = (await balanceRes.json().catch(() => ({}))) as {
      ok?: boolean
      error?: string
      data?: Record<string, unknown>
    }
    if (!configRes.ok || !configPayload.ok) {
      throw new Error(configPayload.error || `Backend error (${configRes.status})`)
    }
    if (!balanceRes.ok || !balancePayload.ok) {
      throw new Error(balancePayload.error || `Backend error (${balanceRes.status})`)
    }

    const balance = balancePayload.data || {}
    const config = configPayload.data || {}
    const walletId = String(balance.wallet_id || "primary")
    const eoaAddress = String(balance.eoa_address || "")

    return NextResponse.json({
      success: true,
      data: {
        wallets: [
          {
            id: walletId,
            alias: "primary",
            address: eoaAddress || null,
            policy: {
              wallets: {
                primary: {
                  limits: {},
                  rate_limits: {},
                  recipients: {
                    mode: "sdk_managed",
                    domains: [],
                  },
                  confirm_threshold: null,
                },
              },
            },
          },
        ],
        network: config.network || "ARC_TESTNET",
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Wallet fetch failed",
        timestamp: new Date().toISOString(),
      },
      { status: 502 }
    )
  }
}
