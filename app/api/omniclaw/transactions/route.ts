import { NextResponse } from "next/server"

import {
  getTransactions,
  toProxyError,
  toProxySuccess,
} from "@/lib/omniclaw/client"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const limit = Number.parseInt(url.searchParams.get("limit") || "50", 10)

  try {
    return NextResponse.json(toProxySuccess(await getTransactions(limit)))
  } catch (error) {
    return NextResponse.json(toProxyError(error), { status: 502 })
  }
}
