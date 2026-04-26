import { NextResponse } from "next/server"

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

function deterministicSummary(originalPrompt: string, executedSteps: Array<Record<string, unknown>>) {
  const sections: string[] = []
  for (const step of executedSteps) {
    const toolId = String(step.toolId || "api_call")
    const response = (step.response as Record<string, unknown> | undefined) || {}
    const data = (response.data as Record<string, unknown> | undefined) || {}
    const entries = Object.entries(data).filter(([key]) => key !== "localPaidApiDemo")
    if (!entries.length) continue

    if (toolId === "product_discovery") {
      sections.push(formatProductDiscovery(data))
      continue
    }
    if (toolId === "product_purchase") {
      sections.push(formatProductPurchase(data))
      continue
    }

    const body = entries.map(([key, value]) => `${key}: ${formatValue(value)}`).join("\n")
    sections.push(`${toolId}\n${body}`)
  }

  if (!sections.length) {
    return `I completed the approved API workflow for: "${originalPrompt}".`
  }

  return `Result for "${originalPrompt}":\n\n${sections.join("\n\n")}`
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      provider?: "gemini" | "featherless" | "aivml" | "fallback"
      model?: string
      originalPrompt?: string
      executedSteps?: Array<Record<string, unknown>>
    }

    const provider = body.provider || "fallback"
    const model = body.model || ""
    const originalPrompt = String(body.originalPrompt || "")
    const executedSteps = Array.isArray(body.executedSteps) ? body.executedSteps : []

    if (!originalPrompt) {
      return NextResponse.json({ ok: false, error: "originalPrompt is required" }, { status: 400 })
    }

    void provider
    void model

    return NextResponse.json({
      ok: true,
      provider: "fallback",
      answer: deterministicSummary(originalPrompt, executedSteps),
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Final answer failed",
      },
      { status: 500 }
    )
  }
}
