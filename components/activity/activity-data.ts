import type {
  ApiPayment,
  DepositActivity,
  WithdrawalActivity,
} from "@/components/activity/types"

export const apiPayments: ApiPayment[] = [
  {
    service: "twitter/user/info",
    amount: "0.00044",
    hash: null, // gateway-batched / not exposed yet
    time: "3m ago",
    status: "completed",
  },
  {
    service: "scholar/search/web",
    amount: "0.00100",
    hash: null, // gateway-batched / not exposed yet
    time: "18m ago",
    status: "completed",
  },
  {
    service: "youtube/search",
    amount: "0.00092",
    hash: null, // gateway-batched / not exposed yet
    time: "54m ago",
    status: "completed",
  },
  {
    service: "twitter/user/info",
    amount: "0.00044",
    hash: null,
    time: "1h ago",
    status: "completed",
  },
]

export const depositActivity: DepositActivity[] = [
  {
    type: "Deposit",
    rawAmount: 3000000, // 3.00 USDC
    status: "pending",
    hash: "0x9a12...f301",
    time: "31m ago",
  },
  {
    type: "Deposit",
    rawAmount: 10000000, // 10.00 USDC
    status: "completed",
    hash: "0x9a12...f301",
    time: "3h ago",
  },
  {
    type: "Deposit",
    rawAmount: 1000000, // 1.00 USDC
    status: "completed",
    hash: "0x9a12...f301",
    time: "1d ago",
  },
]

export const withdrawalActivity: WithdrawalActivity[] = [
  {
    type: "Withdraw",
    rawAmount: 2830000, // 2.83 USDC
    status: "completed",
    hash: "0x9a12...f301",
    time: "1d ago",
  },
  {
    type: "Withdraw",
    rawAmount: 500000, // 0.50 USDC
    status: "pending",
    hash: "0x9a12...f301",
    time: "9h ago",
  },
]
