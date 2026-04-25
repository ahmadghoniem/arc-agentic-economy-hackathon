import type { GuardItem } from "@/components/guards/types"

export const guardItems: GuardItem[] = [
  {
    id: "daily-budget",
    label: "Daily Budget",
    value: "$100",
    helper: "$31.50 spent / $68.50 remaining",
    icon: "wallet",
    progress: 32,
  },
  {
    id: "recipients",
    label: "Recipients",
    value: "api.aisa.one",
    helper: "Allowlisted receiver",
    icon: "users-three",
  },
  {
    id: "manual-review-threshold",
    label: "Manual Review Threshold",
    value: "$50",
    helper: "Requires approval above threshold",
    icon: "shield-check",
  },
]
