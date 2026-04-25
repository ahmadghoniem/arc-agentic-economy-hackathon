import { NextResponse } from "next/server"

import {
  getBalanceDetail,
  toProxyError,
  toProxySuccess,
} from "@/lib/omniclaw/client"

export async function GET() {
  try {
    return NextResponse.json(toProxySuccess(await getBalanceDetail()))
  } catch (error) {
    return NextResponse.json(toProxyError(error), { status: 502 })
  }
}
