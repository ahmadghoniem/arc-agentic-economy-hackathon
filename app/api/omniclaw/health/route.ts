import { NextResponse } from "next/server"

import { getHealth, toProxyError, toProxySuccess } from "@/lib/omniclaw/client"

export async function GET() {
  try {
    return NextResponse.json(toProxySuccess(await getHealth()))
  } catch (error) {
    return NextResponse.json(toProxyError(error), { status: 502 })
  }
}
