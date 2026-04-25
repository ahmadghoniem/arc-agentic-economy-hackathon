"use client"

import { ServiceCatalog } from "@/components/services/service-catalog-sheet"
import { ScrollArea } from "@/components/ui/scroll-area"

export function RightSidebar() {
  return (
    <aside className="hidden h-full w-[260px] flex-none border-l border-divider bg-background xl:flex xl:flex-col">
      <div className="flex-none border-b border-divider px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
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
