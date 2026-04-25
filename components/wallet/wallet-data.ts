import type { WalletBalance } from "@/components/wallet/types"

export const walletBalances: WalletBalance[] = [
  {
    label: "EOA",
    amount: "14.34",
    statusColor: "bg-muted-foreground",
    copyValue: "0xfa0d...3351",
  },
  {
    label: "Circle",
    amount: "20",
    statusColor: "bg-payment",
    copyValue: "0xc1ce...20c0",
  },
  {
    label: "Gateway",
    amount: "7.17",
    statusColor: "bg-success",
  },
]
