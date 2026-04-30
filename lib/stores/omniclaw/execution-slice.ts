import { getApiTemplate } from "@/lib/omniclaw/services"

import { fetchJson } from "./api"
import { shortenEndpoint } from "./format"
import {
  formatPaymentAmount,
  normalizeStatus,
  parseApiResponse,
} from "./normalizers"
import type { ExecutionSlice, OmniClawSliceCreator } from "./types"

export const createExecutionSlice: OmniClawSliceCreator<ExecutionSlice> = (
  set,
  get
) => ({
  execution: {
    selectedApiId: null,
    status: "idle",
    inspect: null,
    pay: null,
    apiResponse: null,
    error: null,
  },

  async inspectApi(apiId: string) {
    const template = getApiTemplate(apiId)
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
    const template = getApiTemplate(apiId)
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
    const transactionId = String(
      payResult.transaction_id || `pay_${Date.now()}`
    )

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
})
