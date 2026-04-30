import { deposit } from "@/lib/omniclaw/client"
import { proxyErrorJson, proxyJson } from "@/lib/omniclaw/proxy-response"

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const amount = String(body?.amount || "")

  if (!amount) {
    return proxyErrorJson("amount is required", 400)
  }

  return proxyJson(() => deposit(amount))
}
