export const runtime = "nodejs"

type ExecutedStep = Record<string, unknown>

function textStream(text: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(text))
      controller.close()
    },
  })
}

const RESPONSE_HEADERS = {
  "Content-Type": "text/plain; charset=utf-8",
  "Cache-Control": "no-store, no-transform",
  "X-Accel-Buffering": "no",
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "N/A"
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "object" && item !== null ? JSON.stringify(item) : String(item)))
      .join(", ")
  }
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}

function formatProductDiscovery(data: Record<string, unknown>) {
  const query = typeof data.query === "string" ? data.query : "your request"
  const count = typeof data.count === "number" ? data.count : undefined
  const results = Array.isArray(data.results) ? data.results : []

  if (!results.length) {
    return `I checked product discovery for "${query}", but no items were returned.`
  }

  const lines: string[] = []
  lines.push(`I found ${count ?? results.length} options for "${query}":`)
  for (const item of results.slice(0, 5)) {
    if (!item || typeof item !== "object") continue
    const row = item as Record<string, unknown>
    const name = typeof row.name === "string" ? row.name : "Unnamed product"
    const brand = typeof row.brand === "string" ? row.brand : "Unknown brand"
    const category = typeof row.category === "string" ? row.category : "General"
    const price = row.priceUsd !== undefined ? `$${String(row.priceUsd)}` : "N/A"
    const rating = row.rating !== undefined ? String(row.rating) : "N/A"
    const url = typeof row.buyUrl === "string" ? row.buyUrl : null
    lines.push(`- ${name} (${brand}) | ${category} | ${price} | rating ${rating}${url ? ` | ${url}` : ""}`)
  }
  lines.push("Tell me which one you want, and I will run the next paid step.")
  return lines.join("\n")
}

function formatProductPurchase(data: Record<string, unknown>) {
  const status = String(data.status || "").toLowerCase()
  const orderId = String(data.orderId || "")
  const name = String(data.name || "Selected item")
  const brand = String(data.brand || "Unknown brand")
  const price = data.priceUsd !== undefined ? `$${String(data.priceUsd)}` : "N/A"
  const url = String(data.buyUrl || "")
  const message = String(data.message || "")

  if (status === "purchased") {
    return [
      `Purchase confirmed: ${name} (${brand})`,
      `Order ID: ${orderId || "N/A"}`,
      `Charged amount: ${price}`,
      url ? `Product URL: ${url}` : "",
      message ? `Note: ${message}` : "",
    ]
      .filter(Boolean)
      .join("\n")
  }

  return `Purchase step executed, but confirmation details were incomplete.`
}

function deterministicSummary(originalPrompt: string, executedSteps: ExecutedStep[]) {
  const parts: string[] = []
  for (const step of executedSteps) {
    const toolId = String(step.toolId || "api_call")
    const response = (step.response as Record<string, unknown> | undefined) || {}
    const data = (response.data as Record<string, unknown> | undefined) || {}
    const entries = Object.entries(data).filter(([k]) => k !== "localPaidApiDemo")
    if (!entries.length) continue

    if (toolId === "product_discovery") {
      parts.push(formatProductDiscovery(data))
      continue
    }
    if (toolId === "product_purchase") {
      parts.push(formatProductPurchase(data))
      continue
    }

    const formatted = entries
      .map(([key, val]) => `${key}: ${formatValue(val)}`)
      .join("\n")
    parts.push(`${toolId}\n${formatted}`)
  }

  if (!parts.length) {
    return `I completed the approved API workflow for: "${originalPrompt}".`
  }

  return `Result for "${originalPrompt}":\n\n${parts.join("\n\n")}`
}

export async function POST(request: Request) {
  let body: {
    provider?: string
    model?: string
    originalPrompt?: string
    executedSteps?: ExecutedStep[]
  }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return new Response("Invalid JSON body", { status: 400 })
  }

  const provider = String(body.provider || "auto")
  const model = String(body.model || "")
  const originalPrompt = String(body.originalPrompt || "")
  const executedSteps = Array.isArray(body.executedSteps) ? body.executedSteps : []

  if (!originalPrompt) {
    return new Response("originalPrompt is required", { status: 400 })
  }

  void provider
  void model
  const answer = deterministicSummary(originalPrompt, executedSteps)

  return new Response(textStream(answer), { headers: RESPONSE_HEADERS })
}

