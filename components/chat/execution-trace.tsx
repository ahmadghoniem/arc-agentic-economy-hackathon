"use client"

import {
  CheckCircleIcon,
  CircleIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react"

import type {
  TraceStep,
  TraceStepStatus,
  TraceSubStep,
} from "@/components/chat/types"
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtItem,
  ChainOfThoughtStep,
  ChainOfThoughtTrigger,
} from "@/components/ui/chain-of-thought"
import { Loader } from "@/components/ui/loader"
import { Tool, type ToolPart } from "@/components/ui/tool"
import { cn } from "@/lib/utils"

function toToolPart(subStep: TraceSubStep): ToolPart {
  const stateByStatus: Record<TraceStepStatus, ToolPart["state"]> = {
    pending: "input-available",
    active: "input-streaming",
    completed: "output-available",
    failed: "output-error",
  }
  return {
    type: subStep.toolName,
    route: subStep.route,
    state: stateByStatus[subStep.status],
    input: subStep.input,
    output: subStep.output,
    errorText:
      subStep.status === "failed"
        ? "The tool call could not be completed."
        : undefined,
  }
}

function ActivityLogItems({ items }: { items: string[] }) {
  return (
    <div className="space-y-1">
      {items.map((item, index) => (
        <ChainOfThoughtItem key={`${item}-${index}`} className="text-sm">
          {item}
        </ChainOfThoughtItem>
      ))}
    </div>
  )
}

function ActivityLogDisclosure({ items }: { items: string[] }) {
  const latestActivity = items.at(-1)
  const previousActivity = items.slice(0, -1)

  if (!latestActivity) return null

  if (previousActivity.length === 0) {
    return (
      <ChainOfThoughtItem className="text-sm">
        {latestActivity}
      </ChainOfThoughtItem>
    )
  }

  return (
    <ChainOfThought className="w-full">
      <ChainOfThoughtStep>
        <ChainOfThoughtTrigger
          hideDefaultIcon
          inlineCaret
          className="w-full min-w-0 text-sm"
        >
          {latestActivity}
        </ChainOfThoughtTrigger>
        <ChainOfThoughtContent className="[&>div]:block [&>div>div]:mt-1">
          <ActivityLogItems items={previousActivity} />
        </ChainOfThoughtContent>
      </ChainOfThoughtStep>
    </ChainOfThought>
  )
}

function TraceStepView({
  step,
  isLast,
}: {
  step: TraceStep
  isLast?: boolean
}) {
  const isActive = step.status === "active"
  const isFailed = step.status === "failed"
  const activityLog = isActive ? [] : step.activityLog

  return (
    <ChainOfThoughtStep open isLast={isLast}>
      <ChainOfThoughtTrigger
        leftIcon={
          isFailed ? (
            <WarningCircleIcon size={14} weight="fill" />
          ) : step.status === "completed" ? (
            <CheckCircleIcon size={14} weight="fill" />
          ) : (
            <CircleIcon size={10} weight={isActive ? "fill" : "regular"} />
          )
        }
        swapIconOnHover={false}
        className={cn("w-full justify-between", {
          "text-zinc-100": isActive,
          "text-zinc-300": step.status === "completed",
          "text-risk": isFailed,
        })}
      >
        <span className="flex w-full min-w-0 flex-col">
          <span>{step.title}</span>
          {isActive && step.subtitle ? (
            <Loader
              variant="text-shimmer"
              size="sm"
              text={step.subtitle}
              className="mt-1"
            />
          ) : null}
        </span>
      </ChainOfThoughtTrigger>
      <ChainOfThoughtContent>
        {activityLog.length > 0 || step.subSteps?.length ? (
          <div className="space-y-3">
            {activityLog.length > 0 ? (
              <ActivityLogDisclosure items={activityLog} />
            ) : null}
            {step.subSteps?.map((subStep) => (
              <Tool
                key={subStep.id}
                toolPart={toToolPart(subStep)}
                defaultOpen={subStep.status === "active"}
              />
            ))}
          </div>
        ) : null}
      </ChainOfThoughtContent>
    </ChainOfThoughtStep>
  )
}

export function AgentExecutionTrace({ steps }: { steps: TraceStep[] }) {
  const visibleSteps = steps.filter((step) => step.status !== "pending")

  return (
    <section className="w-full max-w-xl rounded-lg border border-divider bg-card p-3 text-card-foreground">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-medium text-foreground">Execution Trace</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Inspecting routes, guards, payments, and response payloads.
          </p>
        </div>
      </div>
      <ChainOfThought>
        {visibleSteps.map((step) => (
          <TraceStepView key={step.id} step={step} />
        ))}
      </ChainOfThought>
    </section>
  )
}
