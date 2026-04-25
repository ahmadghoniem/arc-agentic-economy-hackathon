import { NextResponse } from "next/server"

import { getWallets, toProxyError, toProxySuccess } from "@/lib/omniclaw/client"

export async function GET() {
  try {
    return NextResponse.json(toProxySuccess(await getWallets()))
  } catch (error) {
    return NextResponse.json(toProxyError(error), { status: 502 })
  }
}
