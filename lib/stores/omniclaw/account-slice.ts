import { fetchJson } from "./api"
import { toNumber } from "./format"
import { extractExplorerSnapshot, extractWalletPolicy } from "./normalizers"
import type { AccountSlice, OmniClawSliceCreator } from "./types"

export const createAccountSlice: OmniClawSliceCreator<AccountSlice> = (
  set,
  get
) => ({
  account: {
    eoaAddress: null,
    circleWalletAddress: null,
    walletId: null,
    gatewayBalanceAtomic: 0,
    gatewayOnchainBalanceAtomic: 0,
    circleWalletBalance: null,
    eoaUsdcBalanceAtomic: 0,
    eoaUsdcBalanceDisplay: "0.000000 USDC",
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
            balanceRecord.wallet_id ||
              addressRecord.wallet_id ||
              state.account.walletId ||
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
            explorerSnapshot?.eoaUsdcBalanceAtomic ??
            existingSnapshot.eoaUsdcBalanceAtomic,
          eoaUsdcBalanceDisplay:
            explorerSnapshot?.eoaUsdcBalanceDisplay ??
            existingSnapshot.eoaUsdcBalanceDisplay,
          policy:
            wallets.status === "fulfilled"
              ? extractWalletPolicy(wallets.value)
              : state.account.policy,
          status: "success",
          error: null,
        },
        activity: {
          ...state.activity,
          explorerDeposits:
            explorerSnapshot?.gatewayDeposits ??
            state.activity.explorerDeposits,
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
          walletId: String(
            balanceRecord.wallet_id || state.account.walletId || ""
          ),
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
            explorerSnapshot?.eoaUsdcBalanceAtomic ??
            existingSnapshot.eoaUsdcBalanceAtomic,
          eoaUsdcBalanceDisplay:
            explorerSnapshot?.eoaUsdcBalanceDisplay ??
            existingSnapshot.eoaUsdcBalanceDisplay,
          status: "success",
          error: null,
        },
        activity: {
          ...state.activity,
          explorerDeposits:
            explorerSnapshot?.gatewayDeposits ??
            state.activity.explorerDeposits,
        },
      }))
    } catch (error) {
      set((state) => ({
        account: { ...state.account, status: "error", error: String(error) },
      }))
    }
  },
})
