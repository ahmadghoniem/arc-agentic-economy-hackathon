/**
 * format.ts
 *
 * Pure formatting + extraction helpers for agent execution results.
 * No React, no side effects — safe to test in isolation.
 */

import type { TraceSubStep } from "@/components/chat/types"
import { createId } from "@/lib/utils/id"

/**
 * Maps a model id to its provider so the API routes know which client to use.
 * `auto` lets the server pick when we can't tell.
 */
export function inferProvider(model: string): "auto" | "gemini" | "featherless" {
  if (model.startsWith("gemini-")) return "gemini"
  if (model.includes("/") || model.toLowerCase().includes("qwen"))
    return "featherless"
  return "auto"
}

/** Format a number/string USDC amount as a fixed-precision string. */
export function formatUSDC(value: string | number | undefined) {
  const amount = Number.parseFloat(String(value ?? "0"))
  return `${Number.isFinite(amount) ? amount.toFixed(5) : "0.00000"} USDC`
}

/**
 * Build a human-readable list of payment proofs from executed steps.
 * Returns one line per step preferring tx_hash, then transaction_id, then
 * a generic "payment accepted" marker.
 */
export function buildPaymentProof(executedSteps: Array<Record<string, unknown>>) {
  const lines: string[] = []
  for (const step of executedSteps) {
    const payment = step.payment as Record<string, unknown> | undefined
    const data = payment?.data as Record<string, unknown> | undefined
    const txHash = String(data?.tx_hash || data?.transaction_hash || "")
    const txId = String(data?.transaction_id || "")
    const apiId = String(step.apiId || step.toolId || "API")
    if (txHash) {
      lines.push(`- ${apiId}: tx ${txHash}`)
    } else if (txId) {
      lines.push(`- ${apiId}: transaction ${txId}`)
    } else if (payment?.ok) {
      lines.push(`- ${apiId}: payment accepted`)
    }
  }
  return lines.length ? lines.join("\n") : "- No payment proof returned."
}

/**
 * Convert a single executed step into the `inspect` + `pay` substep pair.
 * Used to populate steps 3 (inspect) and 5 (pay) progressively in the trace.
 */
export function buildSubStepPair(
  step: Record<string, unknown>
): [TraceSubStep, TraceSubStep] {
  const apiId = String(step.apiId || step.toolId || "api")
  const inspect = (step.inspect as Record<string, unknown> | undefined) ?? {}
  const payment = (step.payment as Record<string, unknown> | undefined) ?? {}

  const inspectSub: TraceSubStep = {
    id: createId("inspect"),
    type: "tool",
    toolName: "inspect",
    route: "/api/omniclaw/inspect",
    status: inspect.ok ? "completed" : "failed",
    input: { apiId },
    output: inspect,
  }

  const paySub: TraceSubStep = {
    id: createId("pay"),
    type: "tool",
    toolName: "pay",
    route: "/api/omniclaw/pay",
    status: payment.ok ? "completed" : "failed",
    input: { apiId },
    output: payment,
  }

  return [inspectSub, paySub]
}

/** Extract the price paid from an executed step (falls back to 0). */
export function stepPrice(step: Record<string, unknown>): number {
  const payment = step.payment as Record<string, unknown> | undefined
  const data = payment?.data as Record<string, unknown> | undefined
  return Number.parseFloat(String(data?.amount ?? "0")) || 0
}

/** Pause helper — keeps the trace animation readable. */
export const delay = (ms: number) =>
  new Promise<void>((r) => setTimeout(r, ms))
