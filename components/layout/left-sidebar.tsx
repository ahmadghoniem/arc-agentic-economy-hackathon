"use client"

import { ActiveGuards } from "@/components/guards/active-guards"
import { IntegrationStatusDrawer } from "@/components/services/integration-status-drawer"
import { ScrollArea } from "@/components/ui/scroll-area"

export function LeftSidebar() {
  return (
    <aside className="hidden h-full w-[320px] flex-none flex-col border-r border-divider bg-background md:flex">
      <ScrollArea className="min-h-0 flex-1">
        <div className="p-4">
          <ActiveGuards />
        </div>
      </ScrollArea>
      <IntegrationStatusDrawer />
    </aside>
  )
}
