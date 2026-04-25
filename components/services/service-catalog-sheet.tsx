"use client"

import { ArrowUpRightIcon } from "@phosphor-icons/react"

import { services } from "@/components/services/service-data"

export function ServiceCatalog() {
  return (
    <div className="space-y-px">
      {services.map((service) => (
        <div
          key={service.name}
          className="group flex cursor-default items-start justify-between gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-card"
        >
          {/* Left: status dot + name + desc */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="size-1.5 flex-none rounded-full bg-success" />
              <span className="truncate text-sm font-medium text-foreground/90">
                {service.name}
              </span>
              <ArrowUpRightIcon
                size={10}
                className="flex-none text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/60"
              />
            </div>
            <p className="mt-0.5 truncate pl-3 text-xs text-muted-foreground/60">
              {service.desc}
            </p>
          </div>

          {/* Right: price */}
          <div className="flex-none pt-0.5 text-right">
            <span className="font-mono text-xs text-payment">
              ${service.price}
            </span>
            <p className="text-xs text-muted-foreground/50">/ call</p>
          </div>
        </div>
      ))}
    </div>
  )
}
