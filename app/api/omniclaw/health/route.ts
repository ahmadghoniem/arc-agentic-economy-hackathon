import { getHealth } from "@/lib/omniclaw/client"
import { proxyJson } from "@/lib/omniclaw/proxy-response"

export async function GET() {
  return proxyJson(getHealth)
}
