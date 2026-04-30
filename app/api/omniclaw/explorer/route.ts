import { NextResponse } from "next/server"

import { getExplorerSnapshot } from "@/lib/explorer/arcscan"
import { getBalanceDetail } from "@/lib/omniclaw/client"
import { proxyErrorJson } from "@/lib/omniclaw/proxy-response"

export async function GET() {
  try {
    const balanceDetail = (await getBalanceDetail()) as Record<string, unknown>
    const eoaAddress = String(
      balanceDetail.eoa_address || balanceDetail.payment_address || ""
    )

    const explorer = eoaAddress ? await getExplorerSnapshot(eoaAddress) : null

    return NextResponse.json(
      {
        success: true,
        timestamp: new Date().toISOString(),
        data: {
          eoaAddress,
          explorer,
        },
      }
    )
  } catch (error) {
    return proxyErrorJson(error)
  }
}
