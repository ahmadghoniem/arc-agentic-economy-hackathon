"use client"

import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { VariantProps } from "class-variance-authority"

export type PromptSuggestionProps = {
  children: string
  variant?: VariantProps<typeof buttonVariants>["variant"]
  size?: VariantProps<typeof buttonVariants>["size"]
  className?: string
  highlight?: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>

function renderHighlighted(content: string, highlight: string) {
  const contentLower = content.toLowerCase()
  const highlightLower = highlight.trim().toLowerCase()
  const index = contentLower.indexOf(highlightLower)

  if (index === -1) {
    return (
      <span className="text-muted-foreground whitespace-pre-wrap">
        {content}
      </span>
    )
  }

  const before = content.substring(0, index)
  const match = content.substring(index, index + highlightLower.length)
  const after = content.substring(index + highlightLower.length)

  return (
    <>
      {before && (
        <span className="text-muted-foreground whitespace-pre-wrap">
          {before}
        </span>
      )}
      <span className="text-primary font-medium whitespace-pre-wrap">
        {match}
      </span>
      {after && (
        <span className="text-muted-foreground whitespace-pre-wrap">
          {after}
        </span>
      )}
    </>
  )
}

function PromptSuggestion({
  children,
  variant,
  size,
  className,
  highlight,
  ...props
}: PromptSuggestionProps) {
  const isHighlightMode = highlight !== undefined && highlight.trim() !== ""

  if (isHighlightMode) {
    return (
      <Button
        variant={variant ?? "ghost"}
        size={size ?? "sm"}
        className={cn(
          "w-full cursor-pointer justify-start gap-0 rounded-xl py-2",
          "hover:bg-accent",
          className
        )}
        {...props}
      >
        {renderHighlighted(children, highlight)}
      </Button>
    )
  }

  return (
    <Button
      variant={variant ?? "outline"}
      size={size ?? "lg"}
      className={cn(
        "rounded-lg border-divider bg-card",
        "text-muted-foreground transition-all duration-150",
        "hover:bg-primary/5 hover:text-foreground hover:-translate-y-px",
        "active:translate-y-0 active:bg-primary/10",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  )
}

export { PromptSuggestion }
