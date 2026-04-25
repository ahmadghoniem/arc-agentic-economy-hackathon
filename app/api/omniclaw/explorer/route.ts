import { NextResponse } from "next/server"

import { getBalanceDetail, toProxyError, toProxySuccess } from "@/lib/omniclaw/client"
import { getExplorerSnapshot } from "@/lib/explorer/arcscan"

export async function GET() {
  try {
    const balanceDetail = (await getBalanceDetail()) as Record<string, unknown>
    const eoaAddress = String(balanceDetail.eoa_address || balanceDetail.payment_address || "")

    const explorer = eoaAddress
      ? await getExplorerSnapshot(eoaAddress)
      : null

    return NextResponse.json(
      toProxySuccess({
        eoaAddress,
        explorer,
      })
    )
  } catch (error) {
    return NextResponse.json(toProxyError(error), { status: 502 })
  }
}
