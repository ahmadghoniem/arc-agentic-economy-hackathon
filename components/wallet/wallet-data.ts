import type { WalletBalance } from "@/components/wallet/types"

export const walletBalances: WalletBalance[] = [
  {
    label: "EOA",
    amount: "14.34",
    statusColor: "bg-muted-foreground",
    copyValue: "0xfa0d...3351",
  },
  {
    label: "Gateway",
    amount: "7.17",
    statusColor: "bg-success",
  },
]
