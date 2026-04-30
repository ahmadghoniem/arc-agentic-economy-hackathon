import { NextResponse } from "next/server"

import { toProxyError, toProxySuccess } from "@/lib/omniclaw/client"

export function proxyErrorJson(error: unknown, status = 502) {
  return NextResponse.json(toProxyError(error), { status })
}

export async function proxyJson<T>(operation: () => Promise<T>) {
  try {
    return NextResponse.json(toProxySuccess(await operation()))
  } catch (error) {
    return proxyErrorJson(error)
  }
}
