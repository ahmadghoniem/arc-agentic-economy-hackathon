import { NextRequest } from "next/server"

import { proxyToBackend } from "@/app/api/omniclaw/_proxy"

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.toString()
  const path = query ? `/transactions?${query}` : "/transactions"
  return proxyToBackend(path, "GET")
}
