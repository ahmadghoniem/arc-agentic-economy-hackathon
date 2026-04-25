"use client"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { CaretDownIcon, CircleIcon } from "@phosphor-icons/react"
import React from "react"

export type ChainOfThoughtItemProps = React.ComponentProps<"div">

export const ChainOfThoughtItem = ({
  children,
  className,
  ...props
}: ChainOfThoughtItemProps) => (
  <div className={cn("text-muted-foreground", className)} {...props}>
    {children}
  </div>
)

export type ChainOfThoughtTriggerProps = React.ComponentProps<
  typeof CollapsibleTrigger
> & {
  leftIcon?: React.ReactNode
  hideDefaultIcon?: boolean
  inlineCaret?: boolean
  swapIconOnHover?: boolean
}

export const ChainOfThoughtTrigger = ({
  children,
  className,
  hideDefaultIcon = false,
  inlineCaret = false,
  leftIcon,
  swapIconOnHover = true,
  ...props
}: ChainOfThoughtTriggerProps) => (
  <CollapsibleTrigger
    className={cn(
      "group flex cursor-pointer items-center justify-start gap-1 text-left text-muted-foreground transition-colors hover:text-foreground",
      className
    )}
    {...props}
  >
    <div
      className={cn(
        "flex min-w-0 items-center gap-2",
        inlineCaret ? "flex-none" : "flex-1"
      )}
    >
      {leftIcon ? (
        <span className="relative inline-flex size-4 items-center justify-center">
          <span
            className={cn(
              "transition-opacity",
              swapIconOnHover && "group-hover:opacity-0"
            )}
          >
            {leftIcon}
          </span>
          {swapIconOnHover && (
            <CaretDownIcon className="absolute size-4 opacity-0 transition-opacity group-hover:opacity-100 group-data-panel-open:rotate-180" />
          )}
        </span>
      ) : hideDefaultIcon ? null : (
        <span className="relative inline-flex size-4 items-center justify-center">
          <CircleIcon className="size-2 fill-current" weight="fill" />
        </span>
      )}
      <span className={cn("min-w-0", !inlineCaret && "flex-1")}>
        {children}
      </span>
    </div>
    {!leftIcon && (
      <CaretDownIcon className="size-4 transition-transform group-data-panel-open:rotate-180" />
    )}
  </CollapsibleTrigger>
)

export type ChainOfThoughtContentProps = React.ComponentProps<
  typeof CollapsibleContent
>

export const ChainOfThoughtContent = ({
  children,
  className,
  ...props
}: ChainOfThoughtContentProps) => {
  return (
    <CollapsibleContent
      className={cn(
        "overflow-hidden text-popover-foreground data-open:animate-collapsible-down data-closed:animate-collapsible-up",
        className
      )}
      {...props}
    >
      <div className="grid grid-cols-[min-content_minmax(0,1fr)] gap-x-4">
        <div className="col-start-1 row-start-1 ml-1.75 h-full w-px bg-primary/20 group-data-[last=true]:hidden" />
        <div className="col-start-1 row-start-1 ml-1.75 h-full w-px bg-transparent group-data-[last=false]:hidden" />
        <div className="col-start-2 row-start-1 mt-2 min-w-0 space-y-2">
          {children}
        </div>
      </div>
    </CollapsibleContent>
  )
}

export type ChainOfThoughtProps = {
  children: React.ReactNode
  className?: string
}

export function ChainOfThought({ children, className }: ChainOfThoughtProps) {
  const childrenArray = React.Children.toArray(children)

  return (
    <div className={cn("space-y-0", className)}>
      {childrenArray.map((child, index) => (
        <React.Fragment key={index}>
          {React.isValidElement(child) &&
            React.cloneElement(
              child as React.ReactElement<ChainOfThoughtStepProps>,
              {
                isLast: index === childrenArray.length - 1,
              }
            )}
        </React.Fragment>
      ))}
    </div>
  )
}

export type ChainOfThoughtStepProps = {
  children: React.ReactNode
  className?: string
  isLast?: boolean
}

export const ChainOfThoughtStep = ({
  children,
  className,
  isLast = false,
  ...props
}: ChainOfThoughtStepProps & React.ComponentProps<typeof Collapsible>) => {
  return (
    <Collapsible
      className={cn("group", className)}
      data-last={isLast}
      {...props}
    >
      {children}
      <div className="flex justify-start group-data-[last=true]:hidden">
        <div className="ml-1.75 h-4 w-px bg-primary/20" />
      </div>
    </Collapsible>
  )
}
