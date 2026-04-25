"use client"

import { create } from "zustand"

type LoadState = "idle" | "loading" | "success" | "error"
type ActivityStatus = "pending" | "completed" | "failed" | "settling"
type ExecutionStatus =
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

type ApiResult<T = unknown> = {
  success: boolean
  data?: T
  error?: string
}

type ApiTemplate = {
  id: string
  name: string
  url: string
  method: "GET" | "POST"
}

type WalletPolicy = {
  dailyMax: string | null
  perMinute: number | null
  recipientsMode: string | null
  recipientDomains: string[]
  confirmThreshold: string | null
}

type ExplorerSnapshot = {
  eoaUsdcBalanceAtomic: number
  eoaUsdcBalanceDisplay: string
  gatewayDeposits: ExplorerDepositProof[]
}

type OmniClawState = {
  connection: {
    health: unknown
    status: LoadState
    error: string | null
  }
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
  activity: {
    payments: PaymentActivity[]
    deposits: TransferActivity[]
    explorerDeposits: ExplorerDepositProof[]
    withdrawals: TransferActivity[]
    status: LoadState
    error: string | null
  }
  execution: {
    selectedApiId: string | null
    status: ExecutionStatus
    inspect: unknown
    pay: unknown
    apiResponse: unknown
    error: string | null
  }
  refreshConnection: () => Promise<void>
  refreshAccount: () => Promise<void>
  refreshBalance: () => Promise<void>
  refreshTransactions: () => Promise<void>
  deposit: (amount: string) => Promise<void>
  withdraw: (amount: string) => Promise<void>
  inspectApi: (apiId: string) => Promise<unknown>
  payApi: (apiId: string) => Promise<unknown>
  runApi: (apiId: string) => Promise<void>
  resetExecution: () => void
}

const API_TEMPLATES: ApiTemplate[] = [
  {
    id: "twitter-user-info",
    name: "Twitter User Info",
    method: "GET",
    url: "https://api.aisa.one/apis/v2/twitter/user/info?userName=jack",
  },
  {
    id: "multi-search",
    name: "Multi Search",
    method: "POST",
    url: "https://api.aisa.one/apis/v2/scholar/search/web?query=ai+agents&max_num_results=5",
  },
  {
    id: "youtube-search",
    name: "YouTube Search",
    method: "GET",
    url: "https://api.aisa.one/apis/v2/youtube/search?engine=youtube&q=ai+agents&gl=us&hl=en",
  },
]

function findTemplate(apiId: string) {
  return API_TEMPLATES.find((template) => template.id === apiId)
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  const payload = (await res.json().catch(() => ({}))) as ApiResult<T>
  if (!res.ok || !payload.success) {
    throw new Error(payload.error || `${res.status} ${res.statusText}`)
  }
  return payload.data as T
}

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function toStringOrNull(value: unknown) {
  const text = String(value || "").trim()
  return text ? text : null
}

function formatAtomicUsdc(value: number, digits = 2) {
  return `${(value / 1_000_000).toFixed(digits)} USDC`
}

function formatAtomicAmount(value: number, digits = 2) {
  return (value / 1_000_000).toFixed(digits)
}

function formatPaymentAmount(value: unknown, fallbackAtomic = 0) {
  const decimal = Number(value)
  if (Number.isFinite(decimal) && decimal > 0) {
    return {
      amountAtomic: Math.round(decimal * 1_000_000),
      amountDisplay: `${decimal.toFixed(5)} USDC`,
    }
  }

  return {
    amountAtomic: fallbackAtomic,
    amountDisplay: fallbackAtomic ? formatAtomicUsdc(fallbackAtomic, 5) : "0 USDC",
  }
}

function parseApiResponse(value: unknown) {
  if (typeof value !== "string") return value ?? null
  try {
    return JSON.parse(value) as unknown
  } catch {
    return { raw: value }
  }
}

function shortenEndpoint(value: string) {
  try {
    const url = new URL(value)
    return url.pathname.replace(/^\/apis\/v2\//, "")
  } catch {
    return value
  }
}

function normalizeStatus(value: unknown): ActivityStatus {
  const status = String(value || "").toLowerCase()
  if (["completed", "complete", "confirmed", "success", "succeeded"].includes(status)) {
    return "completed"
  }
  if (["failed", "error"].includes(status)) return "failed"
  if (["settling", "received"].includes(status)) return "settling"
  return "pending"
}

function extractWalletPolicy(walletsPayload: unknown): WalletPolicy {
  const record = walletsPayload as Record<string, unknown>
  const wallets = Array.isArray(record?.wallets) ? record.wallets : []
  const wallet = (wallets[0] as Record<string, unknown>) || {}
  const policy = (wallet.policy as Record<string, unknown>) || {}
  const policyWallets = (policy.wallets as Record<string, unknown>) || {}
  const primaryAlias = String(wallet.alias || "primary")
  const policyWallet =
    (policyWallets[primaryAlias] as Record<string, unknown>) ||
    (policyWallets.primary as Record<string, unknown>) ||
    {}
  const limits = (policyWallet.limits || {}) as Record<string, unknown>
  const recipients = (policyWallet.recipients || {}) as Record<string, unknown>
  const rateLimits = (policyWallet.rate_limits || {}) as Record<string, unknown>

  return {
    dailyMax: limits.daily_max ? String(limits.daily_max) : null,
    perMinute:
      rateLimits.per_minute !== undefined && rateLimits.per_minute !== null
        ? Number(rateLimits.per_minute)
        : null,
    recipientsMode: recipients.mode ? String(recipients.mode) : null,
    recipientDomains: Array.isArray(recipients.domains)
      ? recipients.domains.map((domain) => String(domain))
      : [],
    confirmThreshold: policyWallet.confirm_threshold
      ? String(policyWallet.confirm_threshold)
      : null,
  }
}

function extractExplorerSnapshot(payload: unknown): ExplorerSnapshot {
  const record = payload as Record<string, unknown>
  const explorer = (record?.explorer as Record<string, unknown>) || {}
  const gatewayDeposits = Array.isArray(explorer.gatewayDeposits)
    ? explorer.gatewayDeposits
    : []

  return {
    eoaUsdcBalanceAtomic: toNumber(explorer.eoaUsdcBalanceAtomic),
    eoaUsdcBalanceDisplay:
      toStringOrNull(explorer.eoaUsdcBalanceDisplay) || "0.00 USDC",
    gatewayDeposits: gatewayDeposits.map((entry, index) => {
      const deposit = entry as Record<string, unknown>
      const amountAtomic = toNumber(deposit.amountAtomic)
      return {
        transactionHash: String(
          deposit.transactionHash || deposit.transaction_hash || `deposit_${index}`
        ),
        blockNumber:
          deposit.blockNumber !== undefined && deposit.blockNumber !== null
            ? Number(deposit.blockNumber)
            : null,
        timestamp: String(deposit.timestamp || new Date().toISOString()),
        amountAtomic,
        amountDisplay:
          toStringOrNull(deposit.amountDisplay) || formatAtomicUsdc(amountAtomic),
        fromAddress: String(deposit.fromAddress || deposit.from_address || ""),
        toAddress: String(deposit.toAddress || deposit.to_address || ""),
        explorerUrl: String(deposit.explorerUrl || deposit.explorer_url || ""),
      }
    }),
  }
}

function normalizePayments(payload: unknown): PaymentActivity[] {
  const record = payload as Record<string, unknown>
  const transactions = Array.isArray(record?.transactions)
    ? record.transactions
    : []

  return transactions.map((entry, index) => {
    const tx = entry as Record<string, unknown>
    const transactionId = String(tx.id || `tx_${index}`)
    const recipient = String(tx.recipient || "")
    const amount = formatPaymentAmount(tx.amount)

    return {
      id: transactionId,
      apiName: shortenEndpoint(recipient),
      amountAtomic: amount.amountAtomic,
      amountDisplay: amount.amountDisplay,
      transactionId,
      status: normalizeStatus(tx.status),
      createdAt: String(tx.created_at || new Date().toISOString()),
      recipient,
      method: "x402",
    }
  })
}

export const useOmniClawStore = create<OmniClawState>((set, get) => ({
  connection: {
    health: null,
    status: "idle",
    error: null,
  },
  account: {
    eoaAddress: null,
    circleWalletAddress: null,
    walletId: null,
    gatewayBalanceAtomic: 0,
    gatewayOnchainBalanceAtomic: 0,
    circleWalletBalance: null,
    eoaUsdcBalanceAtomic: 0,
    eoaUsdcBalanceDisplay: "0.00 USDC",
    policy: {
      dailyMax: null,
      perMinute: null,
      recipientsMode: null,
      recipientDomains: [],
      confirmThreshold: null,
    },
    status: "idle",
    error: null,
  },
  activity: {
    payments: [],
    deposits: [],
    explorerDeposits: [],
    withdrawals: [],
    status: "idle",
    error: null,
  },
  execution: {
    selectedApiId: null,
    status: "idle",
    inspect: null,
    pay: null,
    apiResponse: null,
    error: null,
  },

  async refreshConnection() {
    set((state) => ({
      connection: { ...state.connection, status: "loading", error: null },
    }))
    try {
      const health = await fetchJson("/api/omniclaw/health")
      set({ connection: { health, status: "success", error: null } })
    } catch (error) {
      set((state) => ({
        connection: {
          ...state.connection,
          status: "error",
          error: String(error),
        },
      }))
    }
  },

  async refreshAccount() {
    set((state) => ({
      account: { ...state.account, status: "loading", error: null },
    }))
    try {
      const [address, balance, wallets, explorer] = await Promise.allSettled([
        fetchJson("/api/omniclaw/address"),
        fetchJson("/api/omniclaw/balance-detail"),
        fetchJson("/api/omniclaw/wallets"),
        fetchJson("/api/omniclaw/explorer"),
      ])

      const addressRecord =
        address.status === "fulfilled"
          ? (address.value as Record<string, unknown>)
          : {}
      const balanceRecord =
        balance.status === "fulfilled"
          ? (balance.value as Record<string, unknown>)
          : {}
      const explorerRecord =
        explorer.status === "fulfilled"
          ? (explorer.value as Record<string, unknown>)
          : {}
      const explorerSnapshot =
        explorerRecord.explorer && typeof explorerRecord.explorer === "object"
          ? extractExplorerSnapshot(explorerRecord)
          : null
      const existingSnapshot = get().account

      set((state) => ({
        account: {
          ...state.account,
          eoaAddress: String(
            addressRecord.eoa_address ||
              balanceRecord.eoa_address ||
              balanceRecord.payment_address ||
              state.account.eoaAddress ||
              ""
          ),
          circleWalletAddress: String(
            addressRecord.circle_wallet_address ||
              balanceRecord.circle_wallet_address ||
              state.account.circleWalletAddress ||
              ""
          ),
          walletId: String(
            balanceRecord.wallet_id || addressRecord.wallet_id || state.account.walletId || ""
          ),
          gatewayBalanceAtomic: toNumber(
            balanceRecord.gateway_balance_atomic,
            state.account.gatewayBalanceAtomic
          ),
          gatewayOnchainBalanceAtomic: toNumber(
            balanceRecord.gateway_onchain_balance_atomic,
            state.account.gatewayOnchainBalanceAtomic
          ),
          circleWalletBalance: balanceRecord.circle_wallet_balance
            ? String(balanceRecord.circle_wallet_balance)
            : state.account.circleWalletBalance,
          eoaUsdcBalanceAtomic:
            explorerSnapshot?.eoaUsdcBalanceAtomic ?? existingSnapshot.eoaUsdcBalanceAtomic,
          eoaUsdcBalanceDisplay:
            explorerSnapshot?.eoaUsdcBalanceDisplay ?? existingSnapshot.eoaUsdcBalanceDisplay,
          policy:
            wallets.status === "fulfilled"
              ? extractWalletPolicy(wallets.value)
              : state.account.policy,
          status: "success",
          error: null,
        },
        activity: {
          ...state.activity,
          explorerDeposits: explorerSnapshot?.gatewayDeposits ?? state.activity.explorerDeposits,
        },
      }))
    } catch (error) {
      set((state) => ({
        account: { ...state.account, status: "error", error: String(error) },
      }))
    }
  },

  async refreshBalance() {
    set((state) => ({
      account: { ...state.account, status: "loading", error: null },
    }))
    try {
      const [balance, explorer] = await Promise.allSettled([
        fetchJson("/api/omniclaw/balance-detail"),
        fetchJson("/api/omniclaw/explorer"),
      ])
      const balanceRecord =
        balance.status === "fulfilled"
          ? (balance.value as Record<string, unknown>)
          : {}
      const explorerRecord =
        explorer.status === "fulfilled"
          ? (explorer.value as Record<string, unknown>)
          : {}
      const explorerSnapshot =
        explorerRecord.explorer && typeof explorerRecord.explorer === "object"
          ? extractExplorerSnapshot(explorerRecord)
          : null
      const existingSnapshot = get().account

      set((state) => ({
        account: {
          ...state.account,
          walletId: String(balanceRecord.wallet_id || state.account.walletId || ""),
          eoaAddress: String(
            balanceRecord.eoa_address ||
              balanceRecord.payment_address ||
              state.account.eoaAddress ||
              ""
          ),
          circleWalletAddress: String(
            balanceRecord.circle_wallet_address ||
              state.account.circleWalletAddress ||
              ""
          ),
          gatewayBalanceAtomic: toNumber(
            balanceRecord.gateway_balance_atomic,
            state.account.gatewayBalanceAtomic
          ),
          gatewayOnchainBalanceAtomic: toNumber(
            balanceRecord.gateway_onchain_balance_atomic,
            state.account.gatewayOnchainBalanceAtomic
          ),
          circleWalletBalance: balanceRecord.circle_wallet_balance
            ? String(balanceRecord.circle_wallet_balance)
            : state.account.circleWalletBalance,
          eoaUsdcBalanceAtomic:
            explorerSnapshot?.eoaUsdcBalanceAtomic ?? existingSnapshot.eoaUsdcBalanceAtomic,
          eoaUsdcBalanceDisplay:
            explorerSnapshot?.eoaUsdcBalanceDisplay ?? existingSnapshot.eoaUsdcBalanceDisplay,
          status: "success",
          error: null,
        },
        activity: {
          ...state.activity,
          explorerDeposits: explorerSnapshot?.gatewayDeposits ?? state.activity.explorerDeposits,
        },
      }))
    } catch (error) {
      set((state) => ({
        account: { ...state.account, status: "error", error: String(error) },
      }))
    }
  },

  async refreshTransactions() {
    set((state) => ({
      activity: { ...state.activity, status: "loading", error: null },
    }))
    try {
      const payload = await fetchJson("/api/omniclaw/transactions?limit=20")
      set((state) => ({
        activity: {
          ...state.activity,
          payments: normalizePayments(payload),
          status: "success",
          error: null,
        },
      }))
    } catch (error) {
      set((state) => ({
        activity: { ...state.activity, status: "error", error: String(error) },
      }))
    }
  },

  async deposit(amount: string) {
    const result = (await fetchJson("/api/omniclaw/deposit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    })) as Record<string, unknown>
    const rawAmount = Math.round(Number(amount) * 1_000_000)
    const id = String(
      result.deposit_tx_hash || result.approval_tx_hash || `deposit_${Date.now()}`
    )
    set((state) => ({
      activity: {
        ...state.activity,
        deposits: [
          {
            id,
            type: "deposit",
            amountAtomic: rawAmount,
            amountDisplay: formatAtomicUsdc(rawAmount),
            status: normalizeStatus(result.status || "pending"),
            transactionId: id,
            createdAt: new Date().toISOString(),
          },
          ...state.activity.deposits,
        ],
      },
    }))
    await get().refreshBalance()
  },

  async withdraw(amount: string) {
    const result = (await fetchJson("/api/omniclaw/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    })) as Record<string, unknown>
    const rawAmount = Math.round(Number(amount) * 1_000_000)
    const id = String(
      result.mint_tx_hash || result.burn_tx_hash || `withdraw_${Date.now()}`
    )
    set((state) => ({
      activity: {
        ...state.activity,
        withdrawals: [
          {
            id,
            type: "withdraw",
            amountAtomic: rawAmount,
            amountDisplay: formatAtomicUsdc(rawAmount),
            status: normalizeStatus(result.status),
            transactionId: id,
            createdAt: new Date().toISOString(),
          },
          ...state.activity.withdrawals,
        ],
      },
    }))
    await get().refreshBalance()
  },

  async inspectApi(apiId: string) {
    const template = findTemplate(apiId)
    if (!template) throw new Error("API template not found")

    set((state) => ({
      execution: {
        ...state.execution,
        selectedApiId: apiId,
        status: "inspecting",
        error: null,
      },
    }))

    const inspect = await fetchJson("/api/omniclaw/inspect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiId }),
    })

    set((state) => ({
      execution: { ...state.execution, inspect, status: "wallet_ready" },
    }))

    return inspect
  },

  async payApi(apiId: string) {
    const template = findTemplate(apiId)
    if (!template) throw new Error("API template not found")

    set((state) => ({
      execution: { ...state.execution, status: "paying", error: null },
    }))

    const payResult = (await fetchJson("/api/omniclaw/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiId,
        idempotencyKey: `arc_${apiId}_${Date.now()}`,
      }),
    })) as Record<string, unknown>

    const apiResponse = parseApiResponse(payResult.response_data)
    const amount = formatPaymentAmount(payResult.amount)
    const transactionId = String(payResult.transaction_id || `pay_${Date.now()}`)

    set((state) => ({
      execution: {
        ...state.execution,
        pay: payResult,
        apiResponse,
        status: "fulfilled",
        error: null,
      },
      activity: {
        ...state.activity,
        payments: [
          {
            id: transactionId,
            apiName: shortenEndpoint(template.url),
            amountAtomic: amount.amountAtomic,
            amountDisplay: amount.amountDisplay,
            transactionId,
            status: normalizeStatus(payResult.status),
            createdAt: new Date().toISOString(),
            recipient: template.url,
            method: template.method,
          },
          ...state.activity.payments,
        ],
      },
    }))

    await get().refreshBalance()
    return payResult
  },

  async runApi(apiId: string) {
    try {
      set((state) => ({
        execution: {
          ...state.execution,
          selectedApiId: apiId,
          status: "reviewing",
          inspect: null,
          pay: null,
          apiResponse: null,
          error: null,
        },
      }))
      await get().inspectApi(apiId)
      set((state) => ({
        execution: { ...state.execution, status: "policy_checking" },
      }))
      set((state) => ({
        execution: { ...state.execution, status: "paying" },
      }))
      await get().payApi(apiId)
    } catch (error) {
      set((state) => ({
        execution: {
          ...state.execution,
          status: "error",
          error: String(error),
        },
      }))
    }
  },

  resetExecution() {
    set((state) => ({
      execution: {
        ...state.execution,
        selectedApiId: null,
        status: "idle",
        inspect: null,
        pay: null,
        apiResponse: null,
        error: null,
      },
    }))
  },
}))

export { API_TEMPLATES, formatAtomicAmount, formatAtomicUsdc }
