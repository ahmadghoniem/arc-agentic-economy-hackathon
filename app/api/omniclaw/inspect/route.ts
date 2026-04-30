import { inspect } from "@/lib/omniclaw/client"
import { getApiTemplate } from "@/lib/omniclaw/services"
import { proxyErrorJson, proxyJson } from "@/lib/omniclaw/proxy-response"

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const template = getApiTemplate(String(body?.apiId || ""))

  if (!template) {
    return proxyErrorJson("API template not found", 404)
  }

  return proxyJson(() => inspect(template))
}
