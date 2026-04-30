/**
 * execution-phases.ts
 *
 * Pure async helpers for each phase of plan execution. Each phase owns the
 * trace updates for its step and bails out when its `isCurrent()` guard
 * returns false (run abandoned). Centralising these here keeps
 * `useAgentChatRunner` an orchestrator instead of a 500-line god-hook.
 */

import type { TraceSubStep } from "@/components/chat/types"
import type { PatchStep } from "@/components/chat/use-trace-steps"
import type { AgentPlan } from "@/lib/agent/types"
import {
  buildSubStepPair,
  delay,
  formatUSDC,
  stepPrice,
} from "@/lib/agent/format"
import {
  assessPolicyGuards,
  type WalletPolicy,
} from "@/lib/agent/policy-guards"

type ExecutedStep = Record<string, unknown>

type RunGuard = () => boolean

/**
 * Step 3 (animated preview): walks the planned steps and renders fake
 * "inspect" substeps in sequence so users see motion while the real
 * execute-plan call is running in the background.
 */
export async function animateInspectPreview(args: {
  plan: AgentPlan
  patch: PatchStep
  isCurrent: RunGuard
}) {
  const { plan, patch, isCurrent } = args
  patch(3, { status: "active", subtitle: "Inspecting endpoints..." })
  for (let i = 0; i < plan.steps.length; i++) {
    if (!isCurrent()) return
    patch(3, {
      subSteps: Array.from({ length: i + 1 }, (_, j) => ({
        id: `preview-inspect-${j}`,
        type: "tool" as const,
        toolName: "inspect" as const,
        route: "/api/omniclaw/inspect",
        status: j < i ? ("completed" as const) : ("active" as const),
        input: { apiId: plan.steps[j].apiId },
        output: undefined,
      })),
    })
    await delay(600)
  }
}

/**
 * Step 3 (real result replay): replaces the preview substeps with the real
 * inspect results from the backend. Keeps subtitle updates minimal so the
 * activity log stays clean.
 */
export async function replayInspectResults(args: {
  executedSteps: ExecutedStep[]
  patch: PatchStep
  isCurrent: RunGuard
}): Promise<{ totalEstimated: number; subSteps: TraceSubStep[] } | null> {
  const { executedSteps, patch, isCurrent } = args
  const subSteps: TraceSubStep[] = []
  let totalEstimated = 0
  for (const executedStep of executedSteps) {
    if (!isCurrent()) return null
    const [inspectSub] = buildSubStepPair(executedStep)
    subSteps.push(inspectSub)
    totalEstimated += stepPrice(executedStep)
    patch(3, { subSteps: [...subSteps] })
    await delay(250)
  }
  if (!isCurrent()) return null
  patch(3, {
    status: "completed",
    subtitle: `Estimated total: ${formatUSDC(totalEstimated)}.`,
    subSteps,
  })
  return { totalEstimated, subSteps }
}

/**
 * Step 4: real policy-guard assessment. Runs the deterministic guards from
 * `assessPolicyGuards` and reveals each check sequentially. Writes directly
 * to `activityLog` so the dropdown shows a clean per-check list rather than
 * a noisy log of subtitle history.
 */
export async function runPolicyGuards(args: {
  policy: WalletPolicy
  executedSteps: ExecutedStep[]
  totalEstimatedUSDC: number
  patch: PatchStep
  isCurrent: RunGuard
}) {
  const { policy, executedSteps, totalEstimatedUSDC, patch, isCurrent } = args
  patch(4, { status: "active", subtitle: "Running policy checks..." })
  await delay(250)
  const assessment = assessPolicyGuards({
    policy,
    executedSteps,
    totalEstimatedUSDC,
  })
  const checkLog: string[] = []
  for (const check of assessment.checks) {
    if (!isCurrent()) return null
    const mark = check.skipped ? "·" : check.passed ? "✓" : "✗"
    checkLog.push(`${check.label}: ${check.value} ${mark}`)
    patch(4, { activityLog: [...checkLog] })
    await delay(300)
  }
  if (!isCurrent()) return null
  const evaluatedCount = assessment.checks.filter((c) => !c.skipped).length
  const passedCount = assessment.checks.filter(
    (c) => !c.skipped && c.passed
  ).length
  const guardSummary = assessment.requiresReview
    ? `${passedCount}/${evaluatedCount} guards passed · review threshold exceeded (user confirmed).`
    : `${passedCount} of ${evaluatedCount} guard(s) passed.`
  patch(4, { status: "completed", subtitle: guardSummary })
  return assessment
}

/**
 * Step 5: reveal each pay substep one at a time. Uses a preview "active"
 * substep then swaps it for the real result so users see the payment
 * "happen" rather than appear all at once.
 */
export async function replayPayments(args: {
  executedSteps: ExecutedStep[]
  patch: PatchStep
  isCurrent: RunGuard
}): Promise<{ subSteps: TraceSubStep[]; totalPaid: number } | null> {
  const { executedSteps, patch, isCurrent } = args
  patch(5, { status: "active", subtitle: "Initiating payments..." })
  const subSteps: TraceSubStep[] = []
  let totalPaid = 0
  for (const executedStep of executedSteps) {
    if (!isCurrent()) return null
    const apiId = String(
      executedStep.apiId || executedStep.toolId || "api"
    )
    const paid = stepPrice(executedStep)
    totalPaid += paid
    patch(5, {
      subSteps: [
        ...subSteps,
        {
          id: `preview-pay-${subSteps.length}`,
          type: "tool" as const,
          toolName: "pay" as const,
          route: "/api/omniclaw/pay",
          status: "active" as const,
          input: { apiId },
          output: undefined,
        },
      ],
    })
    await delay(700)
    if (!isCurrent()) return null
    const [, paySub] = buildSubStepPair(executedStep)
    subSteps.push(paySub)
    patch(5, { subSteps: [...subSteps] })
    await delay(300)
  }
  if (!isCurrent()) return null
  const anyFailed = subSteps.some((s) => s.status === "failed")
  patch(5, {
    status: anyFailed ? "failed" : "completed",
    subtitle: `${subSteps.length} payment(s) confirmed.`,
    subSteps,
  })
  return { subSteps, totalPaid }
}
