import { NextResponse } from "next/server"

import { pay, toProxyError, toProxySuccess } from "@/lib/omniclaw/client"
import { getApiTemplate } from "@/lib/omniclaw/services"

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const template = getApiTemplate(String(body?.apiId || ""))

  if (!template) {
    return NextResponse.json(toProxyError("API template not found"), {
      status: 404,
    })
  }

  const idempotencyKey =
    typeof body?.idempotencyKey === "string" && body.idempotencyKey
      ? body.idempotencyKey
      : `arc_${template.id}_${Date.now()}`

  try {
    return NextResponse.json(toProxySuccess(await pay(template, idempotencyKey)))
  } catch (error) {
    return NextResponse.json(toProxyError(error), { status: 502 })
  }
}
