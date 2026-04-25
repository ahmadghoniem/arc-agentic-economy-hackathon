export type GuardIcon =
  | "wallet"
  | "arrows-horizontal"
  | "users-three"
  | "shield-check"

export type GuardItem = {
  id: string
  label: string
  value: string
  helper: string
  icon: GuardIcon
  progress?: number
}
