"use client"

import { Transactions } from "@/components/activity/transactions"
import { ScrollArea } from "@/components/ui/scroll-area"

export function RightSidebar() {
  return (
    <aside className="hidden h-full w-[320px] flex-none border-l border-divider bg-background xl:block">
      <ScrollArea className="h-full">
        <div className="p-4">
          <Transactions />
        </div>
      </ScrollArea>
    </aside>
  )
}
