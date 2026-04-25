import { NextResponse } from "next/server"

import { inspect, toProxyError, toProxySuccess } from "@/lib/omniclaw/client"
import { getApiTemplate } from "@/lib/omniclaw/services"

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const template = getApiTemplate(String(body?.apiId || ""))

  if (!template) {
    return NextResponse.json(toProxyError("API template not found"), {
      status: 404,
    })
  }

  try {
    return NextResponse.json(toProxySuccess(await inspect(template)))
  } catch (error) {
    return NextResponse.json(toProxyError(error), { status: 502 })
  }
}
