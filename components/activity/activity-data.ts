import type { ApiPayment, FundActivity } from "@/components/activity/types"

export const apiPayments: ApiPayment[] = [
  {
    service: "twitter/user/info",
    amount: "0.0004",
    hash: null,
    time: "2m ago",
    status: "completed",
  },
  {
    service: "scholar/search/web",
    amount: "0.0010",
    hash: null,
    time: "15m ago",
    status: "completed",
  },
  {
    service: "twitter/user/info",
    amount: "0.0004",
    hash: null,
    time: "1h ago",
    status: "completed",
  },
]

export const fundActivity: FundActivity[] = [
  {
    type: "Deposit",
    rawAmount: 3000000,
    status: "pending",
    hash: "0x3c67...8cf42",
    time: "27m ago",
  },
  {
    type: "Deposit",
    rawAmount: 10000000,
    status: "completed",
    hash: "0x9a12...f301",
    time: "3h ago",
  },
  {
    type: "Withdraw",
    rawAmount: 2830000,
    status: "completed",
    hash: "0xbb4e...1d09",
    time: "1d ago",
  },
]
