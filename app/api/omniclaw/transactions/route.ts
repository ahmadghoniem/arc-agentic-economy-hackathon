import { getTransactions } from "@/lib/omniclaw/client"
import { proxyJson } from "@/lib/omniclaw/proxy-response"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const limit = Number.parseInt(url.searchParams.get("limit") || "50", 10)

  return proxyJson(() => getTransactions(limit))
}
