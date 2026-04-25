"use client"

import { ArrowsClockwiseIcon } from "@phosphor-icons/react"

import type { AgentPlan } from "@/lib/agent/types"
import { Button } from "@/components/ui/button"

export type PlanRequest = {
  plan: AgentPlan
  model: string
}

export function PlanCard({
  request,
  disabled,
  onConfirm,
  onCancel,
}: {
  request: PlanRequest
  disabled: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const { plan, model } = request

  return (
    <div className="w-full max-w-xl rounded-xl border border-divider bg-card p-4 text-card-foreground">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">Agent Plan</p>
        <p className="text-xs text-muted-foreground">
          Provider: {plan.provider} | Model: {model || "fallback"}
        </p>
        <p className="text-sm text-muted-foreground">{plan.summary}</p>
      </div>

      <div className="mt-3 space-y-2">
        {plan.steps.map((step) => (
          <div
            key={step.id}
            className="rounded-lg border border-divider bg-background/40 p-3 text-sm"
          >
            <p className="font-medium text-foreground">{step.toolName}</p>
            <p className="text-muted-foreground">{step.reason}</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {step.apiId} | {step.estimatedCostUSDC} USDC
            </p>
          </div>
        ))}
      </div>

      <p className="mt-3 font-mono text-sm text-payment">
        Total estimated: {plan.totalEstimatedCostUSDC} USDC
      </p>

      <div className="mt-4 flex gap-2">
        <Button
          type="button"
          size="sm"
          onClick={onConfirm}
          disabled={disabled}
          className="bg-primary text-primary-foreground"
        >
          {disabled ? (
            <>
              <ArrowsClockwiseIcon size={12} weight="bold" className="animate-spin" />
              Confirming…
            </>
          ) : (
            "Confirm and run"
          )}
        </Button>
        {!disabled && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  )
}
