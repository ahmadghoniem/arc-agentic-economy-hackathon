"use client"

import { useOmniClawStore } from "@/lib/stores/omniclaw-store"
import { Payments } from "@/components/activity/payments"
import { Deposits } from "@/components/activity/deposits"
import { Withdrawals } from "@/components/activity/withdrawals"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function Transactions() {
  const paymentCount = useOmniClawStore(
    (state) => state.activity.payments.length
  )
  const depositCount = useOmniClawStore(
    (state) =>
      state.activity.deposits.length + state.activity.explorerDeposits.length
  )
  const withdrawalCount = useOmniClawStore(
    (state) => state.activity.withdrawals.length
  )

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden">
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
          <TabsTrigger value="payments" className="gap-1 px-1 text-[11px]">
            Payments
            <Badge
              variant="outline"
              className="ml-1 h-4 px-1 text-[9px] leading-none"
            >
              {paymentCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="deposits" className="gap-1 px-1 text-[11px]">
            Deposits
            <Badge
              variant="outline"
              className="ml-1 h-4 px-1 text-[9px] leading-none"
            >
              {depositCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="withdrawals" className="gap-1 px-1 text-[11px]">
            Withdrawals
            <Badge
              variant="outline"
              className="ml-1 h-4 px-1 text-[9px] leading-none"
            >
              {withdrawalCount}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="payments"
          className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="min-h-0 flex-1 overflow-y-auto pr-2 [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/80 [&::-webkit-scrollbar-track]:bg-transparent">
            <Payments />
          </div>
        </TabsContent>
        <TabsContent
          value="deposits"
          className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="min-h-0 flex-1 overflow-y-auto pr-2 [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/80 [&::-webkit-scrollbar-track]:bg-transparent">
            <Deposits />
          </div>
        </TabsContent>
        <TabsContent
          value="withdrawals"
          className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="min-h-0 flex-1 overflow-y-auto pr-2 [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/80 [&::-webkit-scrollbar-track]:bg-transparent">
            <Withdrawals />
          </div>
        </TabsContent>
      </Tabs>
    </section>
  )
}
