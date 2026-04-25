/**
 * demo-data.ts
 *
 * All static fixture data for the demo run.
 * When you're ready to plug in a real API, replace these with API responses
 * and remove this file — the hook (use-demo-runner.ts) is the only consumer.
 */

import type { TraceStep, TraceSubStep } from "@/components/chat/types"

export const TRACE_TITLES = [
  "Reviewing your request",
  "Checking API endpoints",
  "Calculating transaction estimates",
  "Running payment guards",
  "Executing payments",
  "Completed",
]

export const createInitialSteps = (): TraceStep[] =>
  TRACE_TITLES.map((title, index) => ({
    id: index + 1,
    title,
    subtitle: "",
    activityLog: [],
    status: "pending" as const,
    subSteps: index + 1 === 3 || index + 1 === 5 ? [] : undefined,
  }))

export const INSPECT_TOOLS: TraceSubStep[] = [
  {
    id: "inspect-twitter",
    type: "tool",
    toolName: "inspect",
    route: "/api/v1/x402/inspect",
    status: "completed",
    input: { endpoint: "https://api.aisa.one/apis/v2/twitter/user/info" },
    output: { price: "$0.0004 USDC", method: "x402", accepts: "USDC" },
  },
  {
    id: "inspect-search",
    type: "tool",
    toolName: "inspect",
    route: "/api/v1/x402/inspect",
    status: "completed",
    input: { endpoint: "https://api.aisa.one/api/v1/multi-search" },
    output: { price: "$0.0010 USDC", method: "x402", accepts: "USDC" },
  },
]

export const PAYMENT_TOOLS: TraceSubStep[] = [
  {
    id: "pay-twitter",
    type: "tool",
    toolName: "pay",
    route: "/api/v1/pay",
    status: "completed",
    input: {
      endpoint: "https://api.aisa.one/apis/v2/twitter/user/info",
      amount: "$0.0004 USDC",
      idempotencyKey: "oc_1776966053861",
    },
    output: {
      status: "confirmed",
      txHash: "227bc5d2-2195-4498",
      route: "OmniClaw Buyer x402",
      data: { handle: "@linus__torvalds", followers: 213840, verified: false },
    },
  },
  {
    id: "pay-search",
    type: "tool",
    toolName: "pay",
    route: "/api/v1/pay",
    status: "completed",
    input: {
      endpoint: "https://api.aisa.one/api/v1/multi-search",
      amount: "$0.0010 USDC",
      idempotencyKey: "oc_1776966053862",
    },
    output: {
      status: "confirmed",
      txHash: "514cc8a1-9d93-4b81",
      route: "OmniClaw Buyer x402",
      data: {
        answer: "Linux was created by Linus Torvalds in 1991.",
        sources: ["kernel.org", "wikipedia.org"],
      },
    },
  },
]

export const DEMO_TOTAL_SPEND = "$0.0014 USDC"
export const DEMO_ENDPOINT_COUNT = 2

export function buildAssistantMessage(selectedSkill: string): string {
  return [
    `I routed this through **${selectedSkill}** and completed the simulated x402 payment flow.`,
    "",
    "- Linux was created by **Linus Torvalds** in 1991.",
    `- The paid Twitter profile lookup returned **213,840 followers** for the demo handle.`,
    `- Total simulated spend: **${DEMO_TOTAL_SPEND}** across **${DEMO_ENDPOINT_COUNT} endpoints**.`,
  ].join("\n")
}

export function needsClarification(prompt: string): boolean {
  const lower = prompt.toLowerCase()
  return (
    (lower.includes("follows me") ||
      lower.includes("follow me") ||
      lower.includes("my twitter")) &&
    !/@[a-z0-9_]+/i.test(prompt)
  )
}
