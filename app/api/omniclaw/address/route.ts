import { NextResponse } from "next/server"

import { getAddress, toProxyError, toProxySuccess } from "@/lib/omniclaw/client"

export async function GET() {
  try {
    return NextResponse.json(toProxySuccess(await getAddress()))
  } catch (error) {
    return NextResponse.json(toProxyError(error), { status: 502 })
  }
}
