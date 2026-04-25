"use client"

import { MagnifyingGlassIcon } from "@phosphor-icons/react"

import { services } from "@/components/services/service-data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function ServiceCatalogSheet() {
  return (
    <SheetContent
      side="right"
      className="top-[52px] h-[calc(100svh-52px)] w-[320px] border-divider bg-background p-0 text-foreground sm:max-w-none"
    >
      <SheetHeader className="border-b border-divider p-4">
        <div className="flex items-start justify-between gap-3 pr-8">
          <div>
            <SheetTitle className="font-semibold text-foreground">
              Service Catalog
            </SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground">
              Paid API Endpoints
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>
      <ScrollArea className="flex-1">
        <div className="space-y-3 p-4">
          {services.map((service) => (
            <Card
              key={service.name}
              size="sm"
              className="border border-divider bg-card text-card-foreground ring-0"
            >
              <CardHeader className="px-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="font-semibold text-foreground">
                      {service.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-1 text-sm text-muted-foreground">
                      {service.desc}
                    </CardDescription>
                  </div>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          className="text-muted-foreground hover:bg-card hover:text-foreground"
                        />
                      }
                    >
                      <MagnifyingGlassIcon size={14} />
                      <span className="sr-only">Inspect endpoint</span>
                    </TooltipTrigger>
                    <TooltipContent>Inspect endpoint</TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between px-3">
                <div className="flex gap-1.5">
                  <Badge
                    variant="outline"
                    className="h-5 rounded-sm border-success/30 bg-transparent text-success"
                  >
                    online
                  </Badge>
                  <Badge
                    variant="outline"
                    className="h-5 rounded-sm border-service/30 bg-transparent text-service"
                  >
                    x402
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  from{" "}
                  <span className="font-mono text-payment">
                    ${service.price}
                  </span>{" "}
                  / call
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </SheetContent>
  )
}
