import { formatAtomicUsdc, shortenEndpoint, toNumber } from "./format"
import type {
  ActivityStatus,
  ExplorerSnapshot,
  PaymentActivity,
  WalletPolicy,
} from "./types"

export function formatPaymentAmount(value: unknown, fallbackAtomic = 0) {
  const decimal = Number(value)

  if (Number.isFinite(decimal) && decimal > 0) {
    return {
      amountAtomic: Math.round(decimal * 1_000_000),
      amountDisplay: `${decimal.toFixed(6)} USDC`,
    }
  }

  return {
    amountAtomic: fallbackAtomic,
    amountDisplay: fallbackAtomic
      ? formatAtomicUsdc(fallbackAtomic)
      : "0.000000 USDC",
  }
}

export function parseApiResponse(value: unknown) {
  if (typeof value !== "string") return value ?? null

  try {
    return JSON.parse(value) as unknown
  } catch {
    return { raw: value }
  }
}

export function normalizeStatus(value: unknown): ActivityStatus {
  const status = String(value || "").toLowerCase()

  if (
    ["completed", "complete", "confirmed", "success", "succeeded"].includes(
      status
    )
  ) {
    return "completed"
  }

  if (["failed", "error"].includes(status)) return "failed"
  if (["settling", "received"].includes(status)) return "settling"
  return "pending"
}

export function extractWalletPolicy(walletsPayload: unknown): WalletPolicy {
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

export function extractExplorerSnapshot(payload: unknown): ExplorerSnapshot {
  const record = payload as Record<string, unknown>
  const explorer = (record?.explorer as Record<string, unknown>) || {}
  const gatewayDeposits = Array.isArray(explorer.gatewayDeposits)
    ? explorer.gatewayDeposits
    : []

  const eoaUsdcBalanceAtomic = toNumber(explorer.eoaUsdcBalanceAtomic)

  return {
    eoaUsdcBalanceAtomic,
    eoaUsdcBalanceDisplay: formatAtomicUsdc(eoaUsdcBalanceAtomic),
    gatewayDeposits: gatewayDeposits.map((entry, index) => {
      const deposit = entry as Record<string, unknown>
      const amountAtomic = toNumber(deposit.amountAtomic)

      return {
        transactionHash: String(
          deposit.transactionHash ||
            deposit.transaction_hash ||
            `deposit_${index}`
        ),
        blockNumber:
          deposit.blockNumber !== undefined && deposit.blockNumber !== null
            ? Number(deposit.blockNumber)
            : null,
        timestamp: String(deposit.timestamp || new Date().toISOString()),
        amountAtomic,
        amountDisplay: formatAtomicUsdc(amountAtomic),
        fromAddress: String(deposit.fromAddress || deposit.from_address || ""),
        toAddress: String(deposit.toAddress || deposit.to_address || ""),
        explorerUrl: String(deposit.explorerUrl || deposit.explorer_url || ""),
      }
    }),
  }
}

export function normalizePayments(payload: unknown): PaymentActivity[] {
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
