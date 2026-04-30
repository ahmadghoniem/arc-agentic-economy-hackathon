"use client"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { StatusDot } from "@/components/ui/status-dot"
import { useOmniClawStore } from "@/lib/stores/omniclaw-store"

export function SystemsPopover() {
  const connection = useOmniClawStore((state) => state.connection)
  const account = useOmniClawStore((state) => state.account)
  const omniReady =
    connection.status === "success" && account.status !== "error"

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
          <StatusDot className={omniReady ? "bg-success" : "bg-pending"} />
          {omniReady ? "Systems OK" : "Syncing"}
        </div>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        className="w-56 border border-divider bg-card text-foreground"
      >
        <div className="flex items-center justify-between">
          <span className="text-foreground">OmniClaw</span>
          <span className="flex items-center gap-1.5 font-mono text-sm text-success">
            <StatusDot className={omniReady ? "bg-success" : "bg-pending"} />
            {omniReady ? "Ready" : "Checking"}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-foreground">AI Provider</span>
          <span className="flex items-center gap-1.5 font-mono text-sm text-muted-foreground">
            <StatusDot className="bg-muted-foreground" />
            Deferred
          </span>
        </div>
      </PopoverContent>
    </Popover>
  )
}
