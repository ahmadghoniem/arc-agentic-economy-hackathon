"use client"

import { Transactions } from "@/components/activity/transactions"
import { ActiveGuards } from "@/components/guards/active-guards"
import { ScrollArea } from "@/components/ui/scroll-area"

export function LeftSidebar() {
  return (
    <aside className="hidden h-full w-[320px] flex-none border-r border-divider bg-background md:block">
      <ScrollArea className="h-full">
        <div className="space-y-4 p-4">
          <ActiveGuards />
          <Transactions />
        </div>
      </ScrollArea>
    </aside>
  )
}
