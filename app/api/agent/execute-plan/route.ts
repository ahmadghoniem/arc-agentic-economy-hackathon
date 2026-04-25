import { NextResponse } from "next/server"

import { getToolById } from "@/lib/agent/api-catalog"
import type { AgentPlan } from "@/lib/agent/types"

async function postJson(
  origin: string,
  path: string,
  body: Record<string, unknown>
): Promise<Record<string, unknown> & { ok: boolean; status: number }> {
  const response = await fetch(`${origin}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  })

  const payload = (await response.json().catch(() => ({
    success: false,
    error: "Invalid JSON response",
  }))) as Record<string, unknown>

  return {
    ok: response.ok && payload.success !== false,
    status: response.status,
    ...payload,
  }
}

function paymentAmountUSDC(payment: Record<string, unknown>, fallback: string) {
  const data = payment.data as Record<string, unknown> | undefined
  const raw = data?.amount
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : Number.parseFloat(fallback || "0")
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      plan?: AgentPlan
      confirmed?: boolean
    }
    const plan = body.plan

    if (!plan || !Array.isArray(plan.steps)) {
      return NextResponse.json(
        { ok: false, error: "Invalid plan payload" },
        { status: 400 }
      )
    }

    if (body.confirmed !== true) {
      return NextResponse.json(
        { ok: false, error: "User confirmation required" },
        { status: 400 }
      )
    }

    const origin = new URL(request.url).origin
    const executedSteps: Array<Record<string, unknown>> = []
    let totalPaid = 0

    for (const step of plan.steps) {
      const tool = getToolById(step.toolId)
      if (!tool || !tool.allowlisted || tool.apiId !== step.apiId) {
        executedSteps.push({
          toolId: step.toolId,
          apiId: step.apiId,
          inspect: { ok: false, error: "Unknown or blocked tool" },
          payment: { ok: false, skipped: true },
          response: { ok: false, skipped: true },
        })
        break
      }

      const inspect = await postJson(origin, "/api/omniclaw/inspect", {
        apiId: step.apiId,
      })

      if (!inspect.ok) {
        executedSteps.push({
          toolId: step.toolId,
          apiId: step.apiId,
          inspect,
          payment: { ok: false, skipped: true },
          response: { ok: false, skipped: true },
        })
        break
      }

      const payment: Record<string, unknown> & { ok: boolean; status: number } =
        await postJson(origin, "/api/omniclaw/pay", {
          apiId: step.apiId,
          stepInput: step.input ?? {},
          idempotencyKey: `arc_agent_${step.apiId}_${Date.now()}`,
        })

      if (!payment.ok) {
        executedSteps.push({
          toolId: step.toolId,
          apiId: step.apiId,
          inspect,
          payment,
          response: { ok: false, skipped: true, error: "Payment failed" },
        })
        break
      }

      totalPaid += paymentAmountUSDC(payment, step.estimatedCostUSDC)
      executedSteps.push({
        toolId: step.toolId,
        apiId: step.apiId,
        inspect,
        payment,
        response: {
          ok: true,
          data:
            (payment.data as Record<string, unknown> | undefined)
              ?.response_data ?? payment.data,
        },
      })
    }

    return NextResponse.json({
      ok: true,
      steps: executedSteps,
      totalPaidUSDC: totalPaid.toFixed(5),
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
