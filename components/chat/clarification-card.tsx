"use client"

import type { ClarificationRequest } from "@/components/chat/use-demo-runner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function ClarificationCard({
  request,
  onValueChange,
  onSubmit,
}: {
  request: ClarificationRequest
  onValueChange: (value: string) => void
  onSubmit: () => void
}) {
  return (
    <div className="w-full max-w-xl rounded-xl border border-amber-500/30 bg-zinc-900 p-4">
      <p className="text-foreground">{request.message}</p>
      <label className="mt-4 block text-sm font-medium tracking-wider text-muted-foreground uppercase">
        {request.paramName}
      </label>
      <div className="mt-2 flex gap-2">
        <Input
          value={request.value}
          onChange={(e) => onValueChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              onSubmit()
            }
          }}
          placeholder="@username"
          className="h-9 bg-background"
        />
        <Button
          type="button"
          onClick={onSubmit}
          disabled={!request.value.trim()}
          className="h-9 bg-primary text-primary-foreground"
        >
          Submit
        </Button>
      </div>
    </div>
  )
}
