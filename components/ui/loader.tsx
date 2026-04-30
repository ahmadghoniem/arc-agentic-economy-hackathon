"use client"

import { cn } from "@/lib/utils"

type LoaderSize = "sm" | "md" | "lg"

export interface LoaderProps {
  variant?: "circular" | "text-shimmer"
  size?: LoaderSize
  text?: string
  className?: string
}

export function CircularLoader({
  className,
  size = "md",
}: {
  className?: string
  size?: LoaderSize
}) {
  const sizeClasses = {
    sm: "size-4",
    md: "size-5",
    lg: "size-6",
  }

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-primary border-t-transparent",
        sizeClasses[size],
        className
      )}
    >
      <span className="sr-only">Loading</span>
    </div>
  )
}

export function TextShimmerLoader({
  text = "Thinking",
  className,
  size = "md",
}: {
  text?: string
  className?: string
  size?: LoaderSize
}) {
  const textSizes = {
    sm: "text-sm",
    md: "",
    lg: "text-base",
  }

  return (
    <div
      className={cn(
        "bg-[linear-gradient(to_right,var(--muted-foreground)_40%,var(--foreground)_60%,var(--muted-foreground)_80%)]",
        "bg-size-[200%_auto] bg-clip-text font-medium text-transparent",
        "animate-shimmer",
        textSizes[size],
        className
      )}
    >
      {text}
    </div>
  )
}

function Loader({
  variant = "circular",
  size = "md",
  text,
  className,
}: LoaderProps) {
  if (variant === "text-shimmer") {
    return <TextShimmerLoader text={text} size={size} className={className} />
  }

  return <CircularLoader size={size} className={className} />
}

export { Loader }
