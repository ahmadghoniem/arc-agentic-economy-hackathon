import { NextResponse } from "next/server"

import { deposit, toProxyError, toProxySuccess } from "@/lib/omniclaw/client"

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const amount = String(body?.amount || "")

  if (!amount) {
    return NextResponse.json(toProxyError("amount is required"), { status: 400 })
  }

  try {
    return NextResponse.json(toProxySuccess(await deposit(amount)))
  } catch (error) {
    return NextResponse.json(toProxyError(error), { status: 502 })
  }
}
