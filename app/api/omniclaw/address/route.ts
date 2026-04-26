import { NextResponse } from "next/server"

const BACKEND_URL = process.env.OMNICLAW_BACKEND_URL || "http://localhost:8090"

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
    return NextResponse.json({
      success: true,
      data: {
        eoa_address: data.eoa_address || null,
        payment_address: data.eoa_address || null,
        circle_wallet_address: data.wallet_address || null,
        wallet_id: data.wallet_id || null,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Address fetch failed",
        timestamp: new Date().toISOString(),
      },
      { status: 502 }
    )
  }
}
