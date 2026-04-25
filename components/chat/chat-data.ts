import type {
  ExecutionStep,
  ModelGroup,
  SkillData,
} from "@/components/chat/types"

export const modelGroups: ModelGroup[] = [
  {
    provider: "FEATHERLESS",
    models: ["claude-haiku-4-5", "qwen3.5-plus", "nemotron-super-free"],
  },
  {
    provider: "GEMINI",
    models: ["gemini-2.0-flash", "gemini-2.5-flash"],
  },
]

export const endpoints = [
  "Auto",
  "Twitter Autopilot",
  "Multi-Source Search",
  "YouTube SERP",
  "Crypto Market Data",
  "Prediction Markets",
  "MarketPulse",
]

export const skillData: SkillData[] = [
  {
    skill: "twitter-autopilot",
    label: "Twitter Autopilot",
    suggestions: [
      "Get the latest tweets from @elonmusk.",
      "How many followers does @sama have?",
      "What are the top trending topics on Twitter right now?",
    ],
  },
  {
    skill: "multi-source-search",
    label: "Multi-Source Search",
    suggestions: [
      "Search for the latest news on Circle and USDC.",
      "Find recent academic papers on autonomous AI agents.",
      "Generate a 30-day brief on the prediction market industry.",
    ],
  },
  {
    skill: "youtube-serp",
    label: "YouTube SERP",
    suggestions: [
      "Find the top YouTube videos about Solana development.",
      "Search YouTube for videos about AI agents tutorial.",
      "Find recent creator explainers about stablecoin payments.",
    ],
  },
  {
    skill: "crypto-market-data",
    label: "Crypto Market Data",
    suggestions: [
      "What is the current price of ETH and BTC?",
      "Compare SOL, ETH, and BTC price trends this week.",
      "Show the top crypto assets by 24-hour volume.",
    ],
  },
  {
    skill: "prediction-markets",
    label: "Prediction Markets",
    suggestions: [
      "What are the current odds on the next US election on Polymarket?",
      "Find prediction markets related to Circle and stablecoins.",
      "Summarize the highest-volume Kalshi technology markets.",
    ],
  },
  {
    skill: "marketpulse",
    label: "MarketPulse",
    suggestions: [
      "Get the latest SEC filings for NVDA.",
      "Full analysis: NVDA price trends, insider trades, analyst estimates, SEC filings.",
      "Compare recent analyst estimates for MSFT and AAPL.",
    ],
  },
]

export const getSuggestionsForEndpoint = (endpoint: string) => {
  if (endpoint === "Auto") {
    return skillData.flatMap((skill) => skill.suggestions.slice(0, 1))
  }

  return (
    skillData.find((skill) => skill.label === endpoint)?.suggestions ??
    skillData.flatMap((skill) => skill.suggestions.slice(0, 1))
  )
}

export const executionSteps: ExecutionStep[] = [
  {
    id: 1,
    name: "Routing",
    detail: "Identifying best endpoints for your request...",
    status: "completed",
  },
  {
    id: 2,
    name: "Estimating",
    detail: "Calculating total cost across 2 endpoints...",
    status: "completed",
  },
  {
    id: 3,
    name: "Guard Check",
    detail: "Running Budget -> Rate -> Recipient guards...",
    status: "completed",
  },
  {
    id: 4,
    name: "Executing",
    detail: "Paying twitter/user/info - $0.0004 USDC",
    status: "active",
  },
  {
    id: 5,
    name: "Done",
    detail: "Completed - Total spent: $0.0008 USDC",
    status: "pending",
  },
]
