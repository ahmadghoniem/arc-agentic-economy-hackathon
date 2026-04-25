/**
 * policy-guards.ts
 *
 * Pure assessment of OmniClaw policy guards against a planned/executed
 * batch of paid API calls. Mirrors the four guards rendered in
 * components/guards/active-guards.tsx (Daily Budget, Rate Limit, Recipients,
 * Review Threshold) plus a per-step Buyer Ready check derived from each
 * inspect response's `buyer_ready` flag.
 *
 * No React, no fetches — safe to unit test.
 */

export type WalletPolicy = {
  dailyMax: string | null
  perMinute: number | null
  recipientsMode: string | null
  recipientDomains: string[]
  confirmThreshold: string | null
}

export type GuardCheckId =
  | "daily-budget"
  | "rate-limit"
  | "recipients"
  | "review-threshold"
  | "buyer-ready"

export type GuardCheck = {
  id: GuardCheckId
  label: string
  value: string
  /** True when the check passes (or is skipped — see `skipped`). */
  passed: boolean
  /** True when policy data is missing and the guard cannot be evaluated. */
  skipped: boolean
  /** Optional helper text for activity logs / tooltips. */
  helper?: string
}

export type GuardAssessment = {
  /** All blocking checks passed. Review-threshold is NOT blocking. */
  passed: boolean
  /** Estimated total exceeded the review threshold (user confirmed via PlanCard). */
  requiresReview: boolean
  checks: GuardCheck[]
}

export type AssessGuardsInput = {
  policy: WalletPolicy
  executedSteps: Array<Record<string, unknown>>
  totalEstimatedUSDC: number
}

function formatUSDC(amount: number): string {
  return `$${amount.toFixed(5)}`
}

function formatPolicyDollar(value: string | null): string {
  if (!value) return "n/a"
  const parsed = Number.parseFloat(value)
  if (!Number.isFinite(parsed)) return value
  // Policy values like "100" or "10.00" — render as "$100.00".
  return `$${parsed.toFixed(2)}`
}

function getRecipientHostname(step: Record<string, unknown>): string | null {
  const inspect = step.inspect as Record<string, unknown> | undefined
  const data = inspect?.data as Record<string, unknown> | undefined
  const url = String(data?.url || "")
  if (!url) return null
  try {
    return new URL(url).hostname.toLowerCase()
  } catch {
    return null
  }
}

function getBuyerReady(step: Record<string, unknown>): boolean | null {
  const inspect = step.inspect as Record<string, unknown> | undefined
  const data = inspect?.data as Record<string, unknown> | undefined
  if (data && typeof data.buyer_ready === "boolean") {
    return data.buyer_ready
  }
  return null
}

function assessDailyBudget(
  policy: WalletPolicy,
  totalEstimatedUSDC: number
): GuardCheck {
  if (!policy.dailyMax) {
    return {
      id: "daily-budget",
      label: "Daily Budget",
      value: "not configured",
      passed: true,
      skipped: true,
      helper: "Policy limit not loaded — skipping check.",
    }
  }
  const limit = Number.parseFloat(policy.dailyMax)
  const passed = !Number.isFinite(limit) || totalEstimatedUSDC <= limit
  return {
    id: "daily-budget",
    label: "Daily Budget",
    value: `${formatUSDC(totalEstimatedUSDC)} of ${formatPolicyDollar(policy.dailyMax)}`,
    passed,
    skipped: false,
    helper: passed
      ? "Within daily spend limit."
      : "Estimated total exceeds the daily spend limit.",
  }
}

function assessRateLimit(
  policy: WalletPolicy,
  callCount: number
): GuardCheck {
  if (policy.perMinute === null || policy.perMinute === undefined) {
    return {
      id: "rate-limit",
      label: "Rate Limit",
      value: "not configured",
      passed: true,
      skipped: true,
      helper: "Rate limit not loaded — skipping check.",
    }
  }
  const passed = callCount <= policy.perMinute
  return {
    id: "rate-limit",
    label: "Rate Limit",
    value: `${callCount} of ${policy.perMinute} req/min`,
    passed,
    skipped: false,
    helper: passed
      ? "Within rate-limit window."
      : "Planned calls exceed the per-minute rate limit.",
  }
}

function assessRecipients(
  policy: WalletPolicy,
  executedSteps: Array<Record<string, unknown>>
): GuardCheck {
  const mode = (policy.recipientsMode || "").toLowerCase()
  if (mode !== "whitelist" || policy.recipientDomains.length === 0) {
    return {
      id: "recipients",
      label: "Recipients",
      value: mode || "not configured",
      passed: true,
      skipped: true,
      helper: "No recipient whitelist configured — skipping check.",
    }
  }

  const allowed = new Set(
    policy.recipientDomains.map((domain) => domain.toLowerCase())
  )
  const recipients = executedSteps
    .map(getRecipientHostname)
    .filter((host): host is string => Boolean(host))

  const offenders = recipients.filter((host) => {
    // Allow exact match or subdomain of any allowlisted domain.
    return ![...allowed].some(
      (domain) => host === domain || host.endsWith(`.${domain}`)
    )
  })

  const passed = offenders.length === 0
  const summary =
    recipients.length > 0
      ? `${recipients.length} call(s) → ${policy.recipientDomains.join(", ")}`
      : `whitelist · ${policy.recipientDomains.join(", ")}`
  return {
    id: "recipients",
    label: "Recipients",
    value: passed ? summary : `blocked: ${offenders.join(", ")}`,
    passed,
    skipped: false,
    helper: passed
      ? "All recipients on the allowlist."
      : `Recipient(s) outside whitelist: ${offenders.join(", ")}.`,
  }
}

function assessReviewThreshold(
  policy: WalletPolicy,
  totalEstimatedUSDC: number
): GuardCheck {
  if (!policy.confirmThreshold) {
    return {
      id: "review-threshold",
      label: "Review Threshold",
      value: "not configured",
      passed: true,
      skipped: true,
      helper: "Review threshold not loaded — skipping check.",
    }
  }
  const threshold = Number.parseFloat(policy.confirmThreshold)
  const exceeded =
    Number.isFinite(threshold) && totalEstimatedUSDC > threshold
  return {
    id: "review-threshold",
    label: "Review Threshold",
    value: `${formatUSDC(totalEstimatedUSDC)} of ${formatPolicyDollar(policy.confirmThreshold)}`,
    // Review threshold is informational — never blocks. `passed` reflects
    // whether the threshold was respected, but callers should consult
    // `assessment.requiresReview` for the user-confirmed override.
    passed: !exceeded,
    skipped: false,
    helper: exceeded
      ? "Estimated total exceeds review threshold — proceeded with user confirmation."
      : "Below review threshold.",
  }
}

function assessBuyerReady(
  executedSteps: Array<Record<string, unknown>>
): GuardCheck {
  if (executedSteps.length === 0) {
    return {
      id: "buyer-ready",
      label: "Buyer Ready",
      value: "no steps",
      passed: true,
      skipped: true,
      helper: "No executed steps to verify.",
    }
  }

  let ready = 0
  let known = 0
  for (const step of executedSteps) {
    const flag = getBuyerReady(step)
    if (flag === null) continue
    known += 1
    if (flag) ready += 1
  }

  if (known === 0) {
    return {
      id: "buyer-ready",
      label: "Buyer Ready",
      value: "not reported",
      passed: true,
      skipped: true,
      helper: "Upstream did not report buyer_ready — skipping check.",
    }
  }

  const passed = ready === known
  return {
    id: "buyer-ready",
    label: "Buyer Ready",
    value: `${ready} of ${known} endpoint(s) ready`,
    passed,
    skipped: false,
    helper: passed
      ? "Upstream confirmed buyer is ready for all endpoints."
      : "One or more endpoints reported buyer_ready=false.",
  }
}

export function assessPolicyGuards(
  input: AssessGuardsInput
): GuardAssessment {
  const { policy, executedSteps, totalEstimatedUSDC } = input

  const checks: GuardCheck[] = [
    assessDailyBudget(policy, totalEstimatedUSDC),
    assessRateLimit(policy, executedSteps.length),
    assessRecipients(policy, executedSteps),
    assessReviewThreshold(policy, totalEstimatedUSDC),
    assessBuyerReady(executedSteps),
  ]

  // Review threshold is informational, not blocking.
  const blockingChecks = checks.filter((c) => c.id !== "review-threshold")
  const passed = blockingChecks.every((c) => c.passed)
  const reviewCheck = checks.find((c) => c.id === "review-threshold")
  const requiresReview = Boolean(
    reviewCheck && !reviewCheck.skipped && !reviewCheck.passed
  )

  return { passed, requiresReview, checks }
}
