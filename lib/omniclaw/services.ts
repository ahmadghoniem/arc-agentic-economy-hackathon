import type { ApiTemplate } from "@/lib/omniclaw/client"

const BASE_URL = "https://api.aisa.one/apis/v2"

export type ApiTemplateWithSchema = ApiTemplate & {
  buildUrl?: (input: Record<string, unknown>) => string
  buildBody?: (input: Record<string, unknown>) => string | undefined
}

/**
 * Resolves a skill endpoint into a full URL, substituting path params and
 * appending query params for GET requests.
 *
 * Path params: /coingecko/coins/{id} + { id: "bitcoin" } → .../coins/bitcoin
 * Query params: remaining keys go to URLSearchParams for GET, body for POST
 */
export function resolveEndpoint(
  path: string,
  method: "GET" | "POST",
  input: Record<string, unknown>
): { url: string; body: string | undefined } {
  // 1. Substitute path params
  let resolvedPath = path
  const usedKeys = new Set<string>()

  resolvedPath = resolvedPath.replace(/\{(\w+)\}/g, (_, key: string) => {
    usedKeys.add(key)
    return encodeURIComponent(String(input[key] ?? ""))
  })

  // 2. Remaining params
  const remaining = Object.entries(input).filter(
    ([k, v]) => !usedKeys.has(k) && v !== undefined && v !== ""
  )

  if (method === "GET") {
    const qs = new URLSearchParams()
    for (const [k, v] of remaining) qs.set(k, String(v))
    const qString = qs.toString()
    return {
      url: `${BASE_URL}${resolvedPath}${qString ? `?${qString}` : ""}`,
      body: undefined,
    }
  }

  // POST: send remaining as JSON body
  return {
    url: `${BASE_URL}${resolvedPath}`,
    body: remaining.length > 0 ? JSON.stringify(Object.fromEntries(remaining)) : undefined,
  }
}

/**
 * Builds an ApiTemplate for a given skill endpoint + runtime input.
 * `input` is optional here — it's used at execution time via buildUrl/buildBody.
 */
export function buildTemplate(
  id: string,
  name: string,
  path: string,
  method: "GET" | "POST"
): ApiTemplateWithSchema {
  return {
    id,
    name,
    method,
    url: `${BASE_URL}${path}`,
    buildUrl: (input) => resolveEndpoint(path, method, input).url,
    buildBody: (input) => resolveEndpoint(path, method, input).body,
  }
}

// Static templates kept for the omniclaw proxy routes that still need them
export const API_TEMPLATES: ApiTemplateWithSchema[] = [
  buildTemplate(
    "twitter-user-info",
    "Twitter User Info",
    "/twitter/user/info",
    "GET"
  ),
  buildTemplate(
    "twitter-last-tweets",
    "Twitter Last Tweets",
    "/twitter/user/last_tweets",
    "GET"
  ),
  buildTemplate(
    "twitter-user-search",
    "Twitter User Search",
    "/twitter/user/search",
    "GET"
  ),
  buildTemplate(
    "twitter-advanced-search",
    "Twitter Advanced Search",
    "/twitter/tweet/advanced_search",
    "GET"
  ),
  buildTemplate(
    "twitter-trends",
    "Twitter Trends",
    "/twitter/trends",
    "GET"
  ),
  buildTemplate("multi-search", "Web Search", "/scholar/search/web", "GET"),
  buildTemplate(
    "scholar-search",
    "Academic Search",
    "/scholar/search/scholar",
    "GET"
  ),
  buildTemplate("perplexity-sonar", "Perplexity Sonar", "/perplexity/sonar", "POST"),
  buildTemplate("youtube-search", "YouTube SERP", "/youtube/search", "GET"),
  buildTemplate(
    "coingecko-price",
    "Crypto Price",
    "/coingecko/simple/price",
    "GET"
  ),
  buildTemplate(
    "coingecko-markets",
    "Crypto Markets",
    "/coingecko/coins/markets",
    "GET"
  ),
  buildTemplate(
    "coingecko-coin",
    "Coin Detail",
    "/coingecko/coins/{id}",
    "GET"
  ),
  buildTemplate(
    "coingecko-trending",
    "Trending Coins",
    "/coingecko/search/trending",
    "GET"
  ),
  buildTemplate("coingecko-news", "Crypto News", "/coingecko/news", "GET"),
  buildTemplate(
    "financial-metrics-snapshot",
    "Stock Metrics Snapshot",
    "/financial/financial-metrics/snapshot",
    "GET"
  ),
  buildTemplate("financial-news", "Stock News", "/financial/news", "GET"),
  buildTemplate(
    "financial-financials",
    "Financial Statements",
    "/financial/financials",
    "GET"
  ),
  buildTemplate(
    "financial-insider-trades",
    "Insider Trades",
    "/financial/insider-trades",
    "GET"
  ),
  buildTemplate(
    "financial-filings",
    "SEC Filings",
    "/financial/filings",
    "GET"
  ),
  buildTemplate(
    "polymarket-markets",
    "Polymarket Markets",
    "/polymarket/markets",
    "GET"
  ),
  buildTemplate(
    "polymarket-events",
    "Polymarket Events",
    "/polymarket/events",
    "GET"
  ),
  buildTemplate(
    "kalshi-markets",
    "Kalshi Markets",
    "/kalshi/markets",
    "GET"
  ),
]

export function getApiTemplate(apiId: string) {
  return API_TEMPLATES.find((t) => t.id === apiId) ?? null
}
