export type ApiPayment = {
  service: string
  amount: string
  hash: string | null
  time: string
  status: "completed" | "pending"
}

export type DepositActivity = {
  type: "Deposit"
  rawAmount: number
  status: "completed" | "pending"
  hash: string
  time: string
}

export type WithdrawalActivity = {
  type: "Withdraw"
  rawAmount: number
  status: "completed" | "pending"
  hash: string
  time: string
}
