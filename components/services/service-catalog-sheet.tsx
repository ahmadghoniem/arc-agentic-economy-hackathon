"use client"

import { ArrowSquareOutIcon } from "@phosphor-icons/react"

import { skillCatalog } from "@/lib/services/skill-catalog"

export function ServiceCatalog() {
  return (
    <div className="space-y-px">
      {skillCatalog.map((service) => (
        <a
          key={service.id}
          href={service.url}
          target="_blank"
          rel="noreferrer"
          className="group flex w-full items-start justify-between gap-3 rounded-md px-2 py-2.5 text-left transition-colors hover:bg-card"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium text-foreground/90">
                {service.name}
              </span>
              <ArrowSquareOutIcon
                size={14}
                className="flex-none text-muted-foreground/80 transition-colors group-hover:text-muted-foreground"
              />
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground/60">
              {service.description}
            </p>
          </div>

          <div className="flex-none pt-0.5 text-right">
            <span className="font-mono text-xs font-semibold text-payment">
              {service.pricePerCall}
            </span>
            <p className="text-xs text-muted-foreground/50">/ call</p>
          </div>
        </a>
      ))}
    </div>
  )
}
