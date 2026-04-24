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
            size="sm"
            className="gap-1.5 text-muted-foreground hover:bg-card hover:text-foreground"
          />
        }
      >
        <StatusDot className="bg-success" />
        Systems OK
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        className="w-56 border border-divider bg-card text-foreground"
      >
        {["OmniClaw", "AI Provider"].map((label) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-sm text-foreground">{label}</span>
            <span className="flex items-center gap-1.5 font-mono text-xs text-success">
              <StatusDot className="bg-success" />
              Configured
            </span>
          </div>
        ))}
      </PopoverContent>
    </Popover>
  )
}
