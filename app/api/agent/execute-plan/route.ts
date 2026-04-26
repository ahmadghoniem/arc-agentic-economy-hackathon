import { NextResponse } from "next/server"

import type { AgentPlan } from "@/lib/agent/types"
import { getToolById } from "@/lib/agent/api-catalog"

type ExecutedStep = {
  toolId: string
  inspect: Record<string, unknown>
  policy: Record<string, unknown>
  payment: Record<string, unknown>
  response: Record<string, unknown>
}

async function postJson(origin: string, path: string, body: Record<string, unknown>) {
  const response = await fetch(`${origin}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  })

  return (await response.json().catch(() => ({ ok: false, error: "Invalid JSON" }))) as Record<string, unknown>
}

function mapInputToQuery(input: Record<string, unknown>) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(input)) {
    if (value === null || value === undefined) continue
    query.set(key, String(value))
  }
  return query.toString()
}

async function fetchToolResponse(
  endpoint: string,
  method: "GET" | "POST",
  input: Record<string, unknown>
) {
  const query = mapInputToQuery(input)
  const url = query ? `${endpoint}${endpoint.includes("?") ? "&" : "?"}${query}` : endpoint

  const tryFetch = async (target: string) => {
    const response = await fetch(target, {
      method,
      cache: "no-store",
      headers: method === "POST" ? { "Content-Type": "application/json" } : undefined,
      body: method === "POST" ? JSON.stringify(input) : undefined,
    })
    const data = await response.json().catch(async () => ({ text: await response.text() }))
    return { ok: response.ok, status: response.status, data, url: target }
  }

  try {
    return await tryFetch(method === "GET" ? url : endpoint)
  } catch {
    // If the endpoint is a local seller endpoint, try the backend fallback
    const backendBase = (process.env.OMNICLAW_BACKEND_URL || "http://localhost:8090").replace(/\/$/, "")
    for (const localPrefix of ["http://localhost:8000/", "http://localhost:8090/"]) {
      if (endpoint.startsWith(localPrefix)) {
        const path = endpoint.replace(localPrefix.slice(0, -1), "")
        const fallback = `${backendBase}${path}`
        return tryFetch(method === "GET" ? (query ? `${fallback}?${query}` : fallback) : fallback)
      }
    }
    throw new Error("Tool endpoint unreachable")
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { plan?: AgentPlan; confirmed?: boolean }
    const plan = body.plan

    if (!plan || !Array.isArray(plan.steps)) {
      return NextResponse.json({ ok: false, error: "Invalid plan payload" }, { status: 400 })
    }

    if (body.confirmed !== true) {
      return NextResponse.json({ ok: false, error: "User confirmation required" }, { status: 400 })
    }

    const origin = new URL(request.url).origin
    const executedSteps: ExecutedStep[] = []
    const contextByTool: Record<string, Record<string, unknown>> = {}
    let totalPaid = 0

    for (const step of plan.steps) {
      const tool = getToolById(step.toolId)
      if (!tool) {
        executedSteps.push({
          toolId: step.toolId,
          inspect: { ok: false, error: "Unknown tool" },
          policy: { ok: false },
          payment: { ok: false },
          response: { ok: false, error: "Unknown tool" },
        })
        break
      }

      if (!tool.allowlisted) {
        executedSteps.push({
          toolId: step.toolId,
          inspect: { ok: false, blocked: true, error: "Tool is not allowlisted" },
          policy: { ok: false, blocked: true },
          payment: { ok: false, skipped: true },
          response: { ok: false, error: "Blocked external request" },
        })
        break
      }

      const resolvedInput = { ...(step.input || {}) } as Record<string, unknown>
      if (typeof resolvedInput.name === "string" && resolvedInput.name.toLowerCase().includes("derived")) {
        const derivedEntity = contextByTool.knowledge_search?.entity
        if (typeof derivedEntity === "string" && derivedEntity.trim()) {
          resolvedInput.name = derivedEntity
        }
      }
      if (step.toolId === "product_purchase") {
        const index = Number(resolvedInput.selectionIndex || 0)
        if ((!resolvedInput.buyUrl || !resolvedInput.priceUsd) && index > 0) {
          const discovered =
            (contextByTool.product_discovery?.results as Array<Record<string, unknown>> | undefined) || []
          const chosen = discovered[index - 1]
          if (chosen) {
            resolvedInput.name = resolvedInput.name || chosen.name
            resolvedInput.buyUrl = resolvedInput.buyUrl || chosen.buyUrl
            resolvedInput.priceUsd = resolvedInput.priceUsd || chosen.priceUsd
          }
        }
      }

      const inspect = await postJson(origin, "/api/omniclaw/inspect", {
        endpoint: step.endpoint,
        input: resolvedInput,
      })

      if (!inspect.ok || inspect.blocked) {
        executedSteps.push({
          toolId: step.toolId,
          inspect,
          policy: { ok: false, blocked: true, reason: inspect.error || "Inspection blocked" },
          payment: { ok: false, skipped: true },
          response: { ok: false, skipped: true },
        })
        break
      }

      const payment = await postJson(origin, "/api/omniclaw/pay", {
        endpoint: step.endpoint,
        amount: step.estimatedCostUSDC,
        purpose: `Agent API call: ${step.toolName}`,
      })

      if (!payment.ok) {
        executedSteps.push({
          toolId: step.toolId,
          inspect,
          policy: { ok: true },
          payment,
          response: { ok: false, skipped: true, error: "Payment failed/unavailable" },
        })
        break
      }

      const toolResponse = await fetchToolResponse(
        tool.endpoint,
        tool.method || "GET",
        resolvedInput
      )
      totalPaid += Number.parseFloat(step.estimatedCostUSDC || "0")

      executedSteps.push({
        toolId: step.toolId,
        inspect,
        policy: { ok: true },
        payment,
        response: {
          ok: toolResponse.ok,
          status: toolResponse.status,
          endpoint: toolResponse.url,
          data: toolResponse.data,
        },
      })

      if (toolResponse.ok && typeof toolResponse.data === "object" && toolResponse.data !== null) {
        contextByTool[step.toolId] = toolResponse.data as Record<string, unknown>
      }
    }

    const finalContext = Object.fromEntries(
      executedSteps.map((step) => [step.toolId, step.response])
    )

    return NextResponse.json({
      ok: true,
      steps: executedSteps,
      totalPaidUSDC: totalPaid.toFixed(4),
      finalContext,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Execution failed",
      },
      { status: 500 }
    )
  }
}
