"use client"

import { Transactions } from "@/components/activity/transactions"
import { UnitEconomics } from "@/components/economics/unit-economics"
import { ActiveGuards } from "@/components/guards/active-guards"
import { ScrollArea } from "@/components/ui/scroll-area"

export function LeftSidebar() {
  return (
    <aside className="hidden h-full w-70 flex-none border-r border-divider bg-background md:flex md:flex-col">
      {/* Guards section — fixed height */}
      <div className="flex-none border-b border-divider">
        <ActiveGuards />
      </div>
      {/* Activity feed — fills remaining space */}
      <div className="flex-none border-b border-divider">
        <UnitEconomics />
      </div>
      <div className="min-h-0 flex-1">
        <ScrollArea className="h-full">
          <div className="p-4">
            <Transactions />
          </div>
        </ScrollArea>
      </div>
    </aside>
  )
}
