"use client"

import { create } from "zustand"

import { createAccountSlice } from "@/lib/stores/omniclaw/account-slice"
import { createActivitySlice } from "@/lib/stores/omniclaw/activity-slice"
import { createConnectionSlice } from "@/lib/stores/omniclaw/connection-slice"
import { createExecutionSlice } from "@/lib/stores/omniclaw/execution-slice"
import type { OmniClawState } from "@/lib/stores/omniclaw/types"

export const useOmniClawStore = create<OmniClawState>()((...args) => ({
  ...createConnectionSlice(...args),
  ...createAccountSlice(...args),
  ...createActivitySlice(...args),
  ...createExecutionSlice(...args),
}))

export { API_TEMPLATES } from "@/lib/omniclaw/services"
export { formatAtomicAmount, formatAtomicUsdc } from "@/lib/stores/omniclaw/format"
export type {
  ExplorerDepositProof,
  OmniClawState,
  PaymentActivity,
  TransferActivity,
} from "@/lib/stores/omniclaw/types"
