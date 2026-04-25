"use client"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { StatusDot } from "@/components/shared/shared"

export function SystemsPopover() {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="lg"
            className="rounded-lg border border-divider bg-card px-3 text-muted-foreground hover:bg-card hover:text-foreground"
          />
        }
      >
        <div className="flex items-center justify-center gap-2">
          <StatusDot className="bg-success" />
          Systems OK
        </div>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        className="w-56 border border-divider bg-card text-foreground"
      >
        {["OmniClaw", "AI Provider"].map((label) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-foreground">{label}</span>
            <span className="flex items-center gap-1.5 font-mono text-sm text-success">
              <StatusDot className="bg-success" />
              Configured
            </span>
          </div>
        ))}
      </PopoverContent>
    </Popover>
  )
}
