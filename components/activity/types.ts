export type ApiPayment = {
  service: string
  amount: string
  hash: string | null
  time: string
  status: "completed" | "pending"
}

export type FundActivity = {
  type: "Deposit" | "Withdraw"
  rawAmount: number
  status: "completed" | "pending"
  hash: string
  time: string
}
