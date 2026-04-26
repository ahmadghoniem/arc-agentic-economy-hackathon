"use client"

import { useOmniClawStore } from "@/lib/stores/omniclaw-store"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Payments } from "@/components/activity/payments"
import { Deposits } from "@/components/activity/deposits"
import { Withdrawals } from "@/components/activity/withdrawals"
import { TransactionFrequency } from "@/components/activity/transaction-frequency"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function Transactions() {
  const paymentCount = useOmniClawStore(
    (state) => state.activity.payments.length
  )
  const depositCount = useOmniClawStore(
    (state) => state.activity.deposits.length + state.activity.explorerDeposits.length
  )
  const withdrawalCount = useOmniClawStore(
    (state) => state.activity.withdrawals.length
  )

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden">
      <TransactionFrequency />

      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Gateway Activity
        </span>
      </div>
      <Tabs
        defaultValue="payments"
        className="min-h-0 flex-1 gap-1 overflow-hidden"
      >
        <TabsList variant="line" className="w-full justify-between gap-1">
          <TabsTrigger value="payments" className="text-[11px] gap-1 px-1">
            Payments
            <Badge variant="outline" className="ml-1 h-4 px-1 text-[9px] leading-none">
              {paymentCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="deposits" className="text-[11px] gap-1 px-1">
            Deposits
            <Badge variant="outline" className="ml-1 h-4 px-1 text-[9px] leading-none">
              {depositCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="withdrawals" className="text-[11px] gap-1 px-1">
            Withdrawals
            <Badge variant="outline" className="ml-1 h-4 px-1 text-[9px] leading-none">
              {withdrawalCount}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="payments"
          className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <ScrollArea className="min-h-0 flex-1 pr-4">
            <Payments />
          </ScrollArea>
        </TabsContent>
        <TabsContent
          value="deposits"
          className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <ScrollArea className="min-h-0 flex-1 pr-4">
            <Deposits />
          </ScrollArea>
        </TabsContent>
        <TabsContent
          value="withdrawals"
          className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <ScrollArea className="min-h-0 flex-1 pr-4">
            <Withdrawals />
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </section>
  )
}
