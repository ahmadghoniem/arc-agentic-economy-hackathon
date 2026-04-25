"use client"

import { Payments } from "@/components/activity/payments"
import { Deposits } from "@/components/activity/deposits"
import { Withdrawals } from "@/components/activity/withdrawals"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function Transactions() {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Activity
        </span>
      </div>
      <Tabs defaultValue="payments" className="gap-3">
        <TabsList variant="line" className="w-full justify-start gap-4">
          <TabsTrigger value="payments" className="text-xs">Payments</TabsTrigger>
          <TabsTrigger value="deposits" className="text-xs">Deposits</TabsTrigger>
          <TabsTrigger value="withdrawals" className="text-xs">Withdrawals</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="mt-3">
          <Payments />
        </TabsContent>
        <TabsContent value="deposits" className="mt-3">
          <Deposits />
        </TabsContent>
        <TabsContent value="withdrawals" className="mt-3">
          <Withdrawals />
        </TabsContent>
      </Tabs>
    </section>
  )
}
