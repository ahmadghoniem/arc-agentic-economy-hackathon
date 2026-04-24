"use client"

import { FundActivity } from "@/components/activity/fund-activity"
import { Transactions } from "@/components/activity/transactions"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

export function RightSidebar() {
  return (
    <aside className="hidden h-full w-[320px] flex-none border-l border-divider bg-background xl:block">
      <ScrollArea className="h-full">
        <div className="p-4">
          <Transactions />
          <Separator className="my-4 bg-divider" />
          <FundActivity />
        </div>
      </ScrollArea>
    </aside>
  )
}
