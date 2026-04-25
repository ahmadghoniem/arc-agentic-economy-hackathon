const DEFAULT_ARCSCAN_BASE_URL = "https://testnet.arcscan.app"
const DEFAULT_GATEWAY_CONTRACT_ADDRESS =
  "0x0077777d7EBA4688BDeF3E311b846F25870A19B9"
const DEFAULT_USDC_TOKEN_ADDRESS = "0x3600000000000000000000000000000000000000"

const ARCSCAN_BASE_URL =
  process.env.ARC_EXPLORER_BASE_URL || DEFAULT_ARCSCAN_BASE_URL
const GATEWAY_CONTRACT_ADDRESS =
  process.env.ARC_GATEWAY_CONTRACT_ADDRESS || DEFAULT_GATEWAY_CONTRACT_ADDRESS
const USDC_TOKEN_ADDRESS =
  process.env.ARC_USDC_TOKEN_ADDRESS || DEFAULT_USDC_TOKEN_ADDRESS

type ArcscanAddressTokenBalance = {
  token?: {
    address_hash?: string
    decimals?: string
    name?: string
    symbol?: string
  }
  value?: string
  balance?: string
  token_balance?: string
  quantity?: string
}

type ArcscanAddressTokenTransfer = {
  transaction_hash?: string
  block_number?: number
  timestamp?: string
  from?: {
    hash?: string
  }
  to?: {
    hash?: string
  }
  token?: {
    address_hash?: string
    decimals?: string
    name?: string
    symbol?: string
  }
  total?: {
    decimals?: string
    value?: string
  }
}

type ArcscanTokenBalancesResponse =
  | ArcscanAddressTokenBalance[]
  | {
      value?: ArcscanAddressTokenBalance[]
      items?: ArcscanAddressTokenBalance[]
      result?: ArcscanAddressTokenBalance[]
      balances?: ArcscanAddressTokenBalance[]
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

export type ExplorerSnapshot = {
  eoaAddress: string
  eoaUsdcBalanceAtomic: number
  eoaUsdcBalanceDisplay: string
  gatewayContractAddress: string
  usdcTokenAddress: string
  gatewayDeposits: ExplorerDepositProof[]
}

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function formatAtomicUsdc(value: number, digits = 6) {
  return `${(value / 1_000_000).toFixed(digits)} USDC`
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" })
  const payload = (await res.json().catch(() => null)) as T | null

  if (!res.ok) {
    const detail =
      typeof payload === "object" && payload && "message" in payload
        ? String((payload as { message?: string }).message || "")
        : ""
    throw new Error(detail || `${res.status} ${res.statusText}`)
  }

  if (!payload) {
    throw new Error(`Empty response from ${url}`)
  }

  return payload
}

function getBalanceValue(entry: ArcscanAddressTokenBalance) {
  return (
    entry.value ??
    entry.balance ??
    entry.token_balance ??
    entry.quantity ??
    "0"
  )
}

function getTokenSymbol(entry: ArcscanAddressTokenBalance) {
  return String(entry.token?.symbol || entry.token?.name || "").toUpperCase()
}

function getTokenAddress(entry: ArcscanAddressTokenBalance) {
  return String(entry.token?.address_hash || "").toLowerCase()
}

export async function getExplorerSnapshot(eoaAddress: string) {
  const address = eoaAddress.trim()
  if (!address) {
    throw new Error("EOA address is required for explorer lookup")
  }

  const [balancesResponse, transfersResponse] = await Promise.all([
    fetchJson<ArcscanTokenBalancesResponse>(
      `${ARCSCAN_BASE_URL}/api/v2/addresses/${address}/token-balances`
    ),
    fetchJson<{ items?: ArcscanAddressTokenTransfer[] }>(
      `${ARCSCAN_BASE_URL}/api/v2/addresses/${address}/token-transfers`
    ),
  ])

  const tokenBalances = Array.isArray(balancesResponse)
    ? balancesResponse
    : (
        balancesResponse.value ||
        balancesResponse.items ||
        balancesResponse.result ||
        balancesResponse.balances ||
        []
      ).filter((entry): entry is ArcscanAddressTokenBalance => Boolean(entry))

  const usdcCandidates = tokenBalances.filter((entry) => {
    const tokenAddress = getTokenAddress(entry)
    const symbol = getTokenSymbol(entry)
    return tokenAddress === USDC_TOKEN_ADDRESS.toLowerCase() || symbol.includes("USDC")
  })

  const usdcBalance = usdcCandidates.reduce<ArcscanAddressTokenBalance | null>(
    (best, candidate) => {
      if (!best) return candidate
      return toNumber(getBalanceValue(candidate)) > toNumber(getBalanceValue(best))
        ? candidate
        : best
    },
    null
  )

  const eoaUsdcBalanceAtomic = toNumber(getBalanceValue(usdcBalance || {}))

  const tokenTransfers = Array.isArray(transfersResponse.items)
    ? transfersResponse.items
    : []

  const gatewayDeposits = tokenTransfers
    .filter((entry) => {
      const tokenAddress = getTokenAddress(entry as ArcscanAddressTokenBalance)
      const tokenSymbol = getTokenSymbol(entry as ArcscanAddressTokenBalance)
      const toAddress = String(entry.to?.hash || "").toLowerCase()
      const fromAddress = String(entry.from?.hash || "").toLowerCase()
      return (
        (tokenAddress === USDC_TOKEN_ADDRESS.toLowerCase() || tokenSymbol === "USDC") &&
        toAddress === GATEWAY_CONTRACT_ADDRESS.toLowerCase() &&
        Boolean(fromAddress)
      )
    })
    .map((entry) => {
      const amountAtomic = toNumber(entry.total?.value)
      const transactionHash = String(entry.transaction_hash || "")
      const timestamp = String(entry.timestamp || new Date().toISOString())
      return {
        transactionHash,
        blockNumber: typeof entry.block_number === "number" ? entry.block_number : null,
        timestamp,
        amountAtomic,
        amountDisplay: formatAtomicUsdc(amountAtomic),
        fromAddress: String(entry.from?.hash || ""),
        toAddress: String(entry.to?.hash || ""),
        explorerUrl: `${ARCSCAN_BASE_URL}/tx/${transactionHash}`,
      }
    })

  return {
    eoaAddress: address,
    eoaUsdcBalanceAtomic,
    eoaUsdcBalanceDisplay: formatAtomicUsdc(eoaUsdcBalanceAtomic),
    gatewayContractAddress: GATEWAY_CONTRACT_ADDRESS,
    usdcTokenAddress: USDC_TOKEN_ADDRESS,
    gatewayDeposits,
  } satisfies ExplorerSnapshot
}
