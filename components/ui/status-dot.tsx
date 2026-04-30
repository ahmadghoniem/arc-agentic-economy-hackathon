"use client"

import { cn } from "@/lib/utils"

export function StatusDot({
  className,
  pulse,
}: {
  className: string
  pulse?: boolean
}) {
  return (
    <span
      className={cn("inline-flex size-1.5 rounded-full", className, {
        "animate-pulse": pulse,
      })}
    />
  )
}
