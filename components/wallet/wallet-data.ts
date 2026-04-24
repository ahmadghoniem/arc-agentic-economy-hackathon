import type { WalletBalance } from "@/components/wallet/types"

export const walletBalances: WalletBalance[] = [
  {
    label: "EOA",
    amount: "14.34 USDC",
    statusColor: "bg-muted-foreground",
    copyValue: "0xfa0d...3351",
  },
  {
    label: "Circle",
    amount: "20 USDC",
    statusColor: "bg-route",
    copyValue: "0x1234...5678",
  },
  {
    label: "Gateway",
    amount: "7.17 USDC",
    statusColor: "bg-success",
  },
]
