import type { ApiTemplate } from "@/lib/omniclaw/client"
import { PAID_API_CATALOG } from "@/lib/agent/api-catalog"

const BASE_URL = "https://api.aisa.one/apis/v2"

export type ApiTemplateWithSchema = ApiTemplate & {
  buildUrl?: (input: Record<string, unknown>) => string
  buildBody?: (input: Record<string, unknown>) => string | undefined
}

export function resolveEndpoint(
  path: string,
  method: "GET" | "POST",
  input: Record<string, unknown>
): { url: string; body: string | undefined } {
  let resolvedPath = path
  const usedKeys = new Set<string>()

  resolvedPath = resolvedPath.replace(/\{(\w+)\}/g, (_, key: string) => {
    usedKeys.add(key)
    return encodeURIComponent(String(input[key] ?? ""))
  })

  const remaining = Object.entries(input).filter(
    ([key, value]) => !usedKeys.has(key) && value !== undefined && value !== ""
  )

  if (method === "GET") {
    const qs = new URLSearchParams()
    for (const [key, value] of remaining) qs.set(key, String(value))
    const query = qs.toString()

    return {
      url: `${BASE_URL}${resolvedPath}${query ? `?${query}` : ""}`,
      body: undefined,
    }
  }

  return {
    url: `${BASE_URL}${resolvedPath}`,
    body:
      remaining.length > 0
        ? JSON.stringify(Object.fromEntries(remaining))
        : undefined,
  }
}

export function buildTemplate(
  id: string,
  name: string,
  path: string,
  method: "GET" | "POST"
): ApiTemplateWithSchema {
  return {
    id,
    name,
    method,
    url: `${BASE_URL}${path}`,
    buildUrl: (input) => resolveEndpoint(path, method, input).url,
    buildBody: (input) => resolveEndpoint(path, method, input).body,
  }
}

export const API_TEMPLATES: ApiTemplateWithSchema[] = PAID_API_CATALOG.map(
  (tool) => buildTemplate(tool.apiId, tool.name, tool.path, tool.method)
)

export function getApiTemplate(apiId: string) {
  return API_TEMPLATES.find((template) => template.id === apiId) ?? null
}
