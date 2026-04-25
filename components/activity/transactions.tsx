"use client"

import { Payments } from "@/components/activity/payments"
import { Deposits } from "@/components/activity/deposits"
import { Withdrawals } from "@/components/activity/withdrawals"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function Transactions() {
  return (
    <section>
      <Tabs defaultValue="payments" className="gap-3">
        <TabsList variant="line" className="w-full justify-between">
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="deposits">Deposits</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="mt-4">
          <Payments />
        </TabsContent>

        <TabsContent value="deposits" className="mt-4">
          <Deposits />
        </TabsContent>

        <TabsContent value="withdrawals" className="mt-4">
          <Withdrawals />
        </TabsContent>
      </Tabs>
    </section>
  )
}
