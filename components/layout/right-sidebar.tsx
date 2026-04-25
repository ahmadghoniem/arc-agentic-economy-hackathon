"use client"

import { ServiceCatalog } from "@/components/services/service-catalog-sheet"
import { ScrollArea } from "@/components/ui/scroll-area"

export function RightSidebar() {
  return (
    <aside className="hidden h-full w-80 flex-none border-l border-divider bg-background xl:flex xl:flex-col">
      <div className="flex h-11 shrink-0 items-center border-b border-divider px-6">
        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Seller Services
        </p>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="p-3">
          <ServiceCatalog />
        </div>
      </ScrollArea>
    </aside>
  )
}
