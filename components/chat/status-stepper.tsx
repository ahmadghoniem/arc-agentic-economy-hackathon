"use client"

import { executionSteps } from "@/components/chat/chat-data"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function StatusStepper() {
  return (
    <Card className="relative my-2 w-full max-w-md border border-divider bg-card p-4 text-card-foreground ring-0">
      <div className="flex flex-col gap-4">
        {executionSteps.map((step, index) => (
          <div key={step.id} className="relative flex items-start gap-3">
            {index < executionSteps.length - 1 ? (
              <div className="absolute top-[14px] bottom-[-16px] left-[5px] w-px bg-divider" />
            ) : null}
            <div className="relative z-10 mt-1 flex size-3 items-center justify-center">
              {step.status === "active" ? (
                <div className="flex gap-[2px]">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="size-1.5 animate-bounce rounded-full bg-pending"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              ) : (
                <span
                  className={cn("size-2 rounded-full", {
                    "bg-success": step.status === "completed",
                    "bg-muted": step.status === "pending",
                  })}
                />
              )}
            </div>
            <div className="flex flex-col">
              <span
                className={cn("text-sm font-medium", {
                  "text-foreground": step.status !== "pending",
                  "text-muted-foreground": step.status === "pending",
                })}
              >
                {step.name}
              </span>
              <span className="mt-0.5 text-xs text-muted-foreground">
                {step.detail.includes("$") ? (
                  <>
                    {step.detail.split("$")[0]}
                    <span className="font-mono text-payment">
                      ${step.detail.split("$")[1]}
                    </span>
                  </>
                ) : (
                  step.detail
                )}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
