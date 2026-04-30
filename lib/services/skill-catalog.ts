import cryptoMarketData from "@/agent-skills/crypto-market-data/data.json"
import marketPulse from "@/agent-skills/marketpulse/data.json"
import multiSourceSearch from "@/agent-skills/multi-source-search/data.json"
import predictionMarketData from "@/agent-skills/prediction-market-data/data.json"
import twitterAutopilot from "@/agent-skills/twitter-autopilot/data.json"
import youtubeSerp from "@/agent-skills/youtube-serp/data.json"

type RawSkillMetadata = {
  skill: string
  description: string
  url: string
  suggestions: string[]
  price_range: {
    min: string
    max: string
  }
}

export type SkillCatalogItem = {
  id: string
  name: string
  description: string
  url: string
  pricePerCall: string
}

export type ChatModelGroup = {
  provider: string
  models: string[]
}

const rawSkills: Array<{ id: string; metadata: RawSkillMetadata }> = [
  { id: "crypto-market-data", metadata: cryptoMarketData },
  { id: "marketpulse", metadata: marketPulse },
  { id: "multi-source-search", metadata: multiSourceSearch },
  { id: "prediction-market-data", metadata: predictionMarketData },
  { id: "twitter-autopilot", metadata: twitterAutopilot },
  { id: "youtube-serp", metadata: youtubeSerp },
]

const DESCRIPTION_MAX_LENGTH = 104

function shortenDescription(description: string) {
  const normalized = description
    .replace(/[\u2013\u2014]|\u00e2\u20ac[\u201c\u201d]/g, "-")
    .replace(/^Complete\s+/i, "")
    .replace(/^Intelligent\s+/i, "")
    .replace(/\s+/g, " ")
    .trim()

  if (normalized.length <= DESCRIPTION_MAX_LENGTH) {
    return normalized
  }

  return `${normalized
    .slice(0, DESCRIPTION_MAX_LENGTH)
    .replace(/[\s,.;:-]+$/g, "")}...`
}

export const skillCatalog: SkillCatalogItem[] = rawSkills.map(
  ({ id, metadata }) => ({
    id,
    name: metadata.skill,
    description: shortenDescription(metadata.description),
    url: metadata.url,
    pricePerCall: metadata.price_range.min,
  })
)

export const chatEndpoints = [
  "Auto",
  ...rawSkills.map(({ metadata }) => metadata.skill),
]

export const fallbackModelGroups: ChatModelGroup[] = [
  {
    provider: "FEATHERLESS",
    models: ["Qwen/Qwen3-8B", "Qwen/Qwen3-14B", "Qwen/Qwen3-30B-A3B"],
  },
]

export function getSuggestionsForEndpoint(endpoint: string) {
  const allDefaultSuggestions = rawSkills.flatMap(({ metadata }) =>
    metadata.suggestions.slice(0, 1)
  )

  if (endpoint === "Auto") {
    return allDefaultSuggestions
  }

  return (
    rawSkills.find(({ metadata }) => metadata.skill === endpoint)?.metadata
      .suggestions ?? allDefaultSuggestions
  )
}
