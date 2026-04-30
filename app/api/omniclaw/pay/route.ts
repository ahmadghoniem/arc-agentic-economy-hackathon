import { pay } from "@/lib/omniclaw/client"
import { getApiTemplate } from "@/lib/omniclaw/services"
import { proxyErrorJson, proxyJson } from "@/lib/omniclaw/proxy-response"

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const template = getApiTemplate(String(body?.apiId || ""))

  if (!template) {
    return proxyErrorJson("API template not found", 404)
  }

  const idempotencyKey =
    typeof body?.idempotencyKey === "string" && body.idempotencyKey
      ? body.idempotencyKey
      : `arc_${template.id}_${Date.now()}`

  const stepInput =
    body?.stepInput && typeof body.stepInput === "object"
      ? (body.stepInput as Record<string, unknown>)
      : {}

  const resolvedUrl = template.buildUrl
    ? template.buildUrl(stepInput)
    : template.url

  const resolvedBody = template.buildBody
    ? template.buildBody(stepInput)
    : template.body

  const resolvedTemplate = {
    ...template,
    url: resolvedUrl,
    body: resolvedBody,
  }

  return proxyJson(() => pay(resolvedTemplate, idempotencyKey))
}
