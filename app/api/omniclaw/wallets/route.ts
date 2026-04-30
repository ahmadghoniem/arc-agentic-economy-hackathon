import { getWallets } from "@/lib/omniclaw/client"
import { proxyJson } from "@/lib/omniclaw/proxy-response"

export async function GET() {
  return proxyJson(getWallets)
}
