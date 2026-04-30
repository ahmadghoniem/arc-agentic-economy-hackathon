import { fetchJson } from "./api"
import { formatAtomicUsdc } from "./format"
import { normalizePayments, normalizeStatus } from "./normalizers"
import type { ActivitySlice, OmniClawSliceCreator } from "./types"

export const createActivitySlice: OmniClawSliceCreator<ActivitySlice> = (
  set,
  get
) => ({
  activity: {
    payments: [],
    deposits: [],
    explorerDeposits: [],
    withdrawals: [],
    status: "idle",
    error: null,
  },

  async refreshTransactions() {
    set((state) => ({
      activity: { ...state.activity, status: "loading", error: null },
    }))

    try {
      const payload = await fetchJson("/api/omniclaw/transactions?limit=50")
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
      result.deposit_tx_hash ||
        result.approval_tx_hash ||
        `deposit_${Date.now()}`
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
})
