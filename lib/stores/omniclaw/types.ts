import type { StateCreator } from "zustand"

export type LoadState = "idle" | "loading" | "success" | "error"

export type ActivityStatus = "pending" | "completed" | "failed" | "settling"

export type ExecutionStatus =
  | "idle"
  | "reviewing"
  | "inspecting"
  | "policy_checking"
  | "wallet_ready"
  | "paying"
  | "settling"
  | "fulfilled"
  | "error"

export type PaymentActivity = {
  id: string
  apiName: string
  amountAtomic: number
  amountDisplay: string
  transactionId: string
  status: ActivityStatus
  createdAt: string
  recipient: string
  method?: string
}

export type TransferActivity = {
  id: string
  type: "deposit" | "withdraw"
  amountAtomic: number
  amountDisplay: string
  status: ActivityStatus
  transactionId: string
  createdAt: string
}

export type ExplorerDepositProof = {
  transactionHash: string
  blockNumber: number | null
  timestamp: string
  amountAtomic: number
  amountDisplay: string
  fromAddress: string
  toAddress: string
  explorerUrl: string
}

export type WalletPolicy = {
  dailyMax: string | null
  perMinute: number | null
  recipientsMode: string | null
  recipientDomains: string[]
  confirmThreshold: string | null
}

export type ExplorerSnapshot = {
  eoaUsdcBalanceAtomic: number
  eoaUsdcBalanceDisplay: string
  gatewayDeposits: ExplorerDepositProof[]
}

export type ConnectionSlice = {
  connection: {
    health: unknown
    status: LoadState
    error: string | null
  }
  refreshConnection: () => Promise<void>
}

export type AccountSlice = {
  account: {
    eoaAddress: string | null
    circleWalletAddress: string | null
    walletId: string | null
    gatewayBalanceAtomic: number
    gatewayOnchainBalanceAtomic: number
    circleWalletBalance: string | null
    eoaUsdcBalanceAtomic: number
    eoaUsdcBalanceDisplay: string
    policy: WalletPolicy
    status: LoadState
    error: string | null
  }
  refreshAccount: () => Promise<void>
  refreshBalance: () => Promise<void>
}

export type ActivitySlice = {
  activity: {
    payments: PaymentActivity[]
    deposits: TransferActivity[]
    explorerDeposits: ExplorerDepositProof[]
    withdrawals: TransferActivity[]
    status: LoadState
    error: string | null
  }
  refreshTransactions: () => Promise<void>
  deposit: (amount: string) => Promise<void>
  withdraw: (amount: string) => Promise<void>
}

export type ExecutionSlice = {
  execution: {
    selectedApiId: string | null
    status: ExecutionStatus
    inspect: unknown
    pay: unknown
    apiResponse: unknown
    error: string | null
  }
  inspectApi: (apiId: string) => Promise<unknown>
  payApi: (apiId: string) => Promise<unknown>
  runApi: (apiId: string) => Promise<void>
  resetExecution: () => void
}

export type OmniClawState =
  & ConnectionSlice
  & AccountSlice
  & ActivitySlice
  & ExecutionSlice

export type OmniClawSliceCreator<T> = StateCreator<OmniClawState, [], [], T>
