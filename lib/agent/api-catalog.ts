import { API_TEMPLATES } from "@/lib/omniclaw/services"

export type ToolParam = {
  name: string
  required: boolean
  type: string
  description: string
  example?: unknown
}

export type PaidApiTool = {
  id: string
  apiId: string
  name: string
  skill: string
  description: string
  method: "GET" | "POST"
  path: string
  priceUSDC: string
  /** @deprecated use params instead */
  requiredParams: string[]
  /** @deprecated use params instead */
  optionalParams: string[]
  params: ToolParam[]
  aliases: string[]
  allowlisted: boolean
}

/**
 * Each entry maps to one registered ApiTemplate in services.ts.
 * The planner is shown `path`, `description`, and the full `params` schema
 * (with descriptions and examples) so the AI can populate step.input correctly.
 */
export const PAID_API_CATALOG: PaidApiTool[] = [
  // ── Twitter Autopilot ────────────────────────────────────────────────────
  {
    id: "twitter_user_info",
    apiId: "twitter-user-info",
    skill: "Twitter Autopilot",
    name: "Twitter User Profile",
    description: "Get profile data for a Twitter/X user (bio, follower count, verified status).",
    method: "GET",
    path: "/twitter/user/info",
    priceUSDC: "0.00044",
    requiredParams: ["userName"],
    optionalParams: [],
    params: [
      {
        name: "userName",
        required: true,
        type: "string",
        description: "Twitter username WITHOUT the @ symbol. Extract from prompt.",
        example: "elonmusk",
      },
    ],
    aliases: ["twitter profile", "x profile", "bio", "follower count", "verified"],
    allowlisted: true,
  },
  {
    id: "twitter_last_tweets",
    apiId: "twitter-last-tweets",
    skill: "Twitter Autopilot",
    name: "Twitter Recent Tweets",
    description: "Get a user's most recent tweets. Use this when asked for tweets, posts, or timeline.",
    method: "GET",
    path: "/twitter/user/last_tweets",
    priceUSDC: "0.00044",
    requiredParams: ["userName"],
    optionalParams: ["cursor"],
    params: [
      {
        name: "userName",
        required: true,
        type: "string",
        description: "Twitter username WITHOUT the @ symbol.",
        example: "sama",
      },
      {
        name: "cursor",
        required: false,
        type: "string",
        description: "Pagination cursor for next page of results.",
        example: "",
      },
    ],
    aliases: ["tweets", "latest tweets", "posts", "timeline", "recent tweets", "what did X post"],
    allowlisted: true,
  },
  {
    id: "twitter_user_search",
    apiId: "twitter-user-search",
    skill: "Twitter Autopilot",
    name: "Twitter User Search",
    description: "Search Twitter users by keyword.",
    method: "GET",
    path: "/twitter/user/search",
    priceUSDC: "0.00044",
    requiredParams: ["query"],
    optionalParams: [],
    params: [
      {
        name: "query",
        required: true,
        type: "string",
        description: "Search keyword or phrase to find Twitter users.",
        example: "AI researcher",
      },
    ],
    aliases: ["find twitter user", "search twitter", "twitter search"],
    allowlisted: true,
  },
  {
    id: "twitter_advanced_search",
    apiId: "twitter-advanced-search",
    skill: "Twitter Autopilot",
    name: "Twitter Advanced Search",
    description: "Advanced tweet search by query and type.",
    method: "GET",
    path: "/twitter/tweet/advanced_search",
    priceUSDC: "0.00044",
    requiredParams: ["query", "queryType"],
    optionalParams: [],
    params: [
      {
        name: "query",
        required: true,
        type: "string",
        description: "Search query for tweets.",
        example: "AI agents",
      },
      {
        name: "queryType",
        required: true,
        type: "string",
        description: "Type of search. Use 'Latest' for newest tweets, 'Top' for most popular.",
        example: "Latest",
      },
    ],
    aliases: ["search tweets", "find tweets about", "tweet search"],
    allowlisted: true,
  },
  {
    id: "twitter_trends",
    apiId: "twitter-trends",
    skill: "Twitter Autopilot",
    name: "Twitter Trending Topics",
    description: "Get trending topics by location (WOEID). Use woeid=1 for worldwide.",
    method: "GET",
    path: "/twitter/trends",
    priceUSDC: "0.00044",
    requiredParams: ["woeid"],
    optionalParams: [],
    params: [
      {
        name: "woeid",
        required: true,
        type: "string",
        description: "Where On Earth ID. Use '1' for worldwide trends. '23424977' for USA. '615702' for Egypt.",
        example: "1",
      },
    ],
    aliases: ["trending", "twitter trends", "what's trending", "top topics"],
    allowlisted: true,
  },

  // ── Multi-Source Search ──────────────────────────────────────────────────
  {
    id: "multi_search",
    apiId: "multi-search",
    skill: "Multi-Source Search",
    name: "Web Search",
    description: "Search the web for news, facts, or general research.",
    method: "GET",
    path: "/scholar/search/web",
    priceUSDC: "0.0024",
    requiredParams: ["query"],
    optionalParams: ["max_num_results"],
    params: [
      {
        name: "query",
        required: true,
        type: "string",
        description: "Natural language web search query.",
        example: "latest news on Circle USDC 2024",
      },
      {
        name: "max_num_results",
        required: false,
        type: "integer",
        description: "Maximum number of results to return. Default 10.",
        example: 5,
      },
    ],
    aliases: ["search", "news", "research", "web search", "latest", "find info"],
    allowlisted: true,
  },
  {
    id: "scholar_search",
    apiId: "scholar-search",
    skill: "Multi-Source Search",
    name: "Academic Search",
    description: "Search academic papers and scholarly sources.",
    method: "GET",
    path: "/scholar/search/scholar",
    priceUSDC: "0.0024",
    requiredParams: ["query"],
    optionalParams: ["max_num_results", "as_ylo", "as_yhi"],
    params: [
      {
        name: "query",
        required: true,
        type: "string",
        description: "Academic search query.",
        example: "autonomous AI agents reinforcement learning",
      },
      {
        name: "max_num_results",
        required: false,
        type: "integer",
        description: "Maximum results to return.",
        example: 5,
      },
      {
        name: "as_ylo",
        required: false,
        type: "integer",
        description: "Year lower bound for publication date filter.",
        example: 2022,
      },
      {
        name: "as_yhi",
        required: false,
        type: "integer",
        description: "Year upper bound for publication date filter.",
        example: 2024,
      },
    ],
    aliases: ["papers", "academic", "research papers", "scholar", "studies", "journal"],
    allowlisted: true,
  },
  {
    id: "perplexity_sonar",
    apiId: "perplexity-sonar",
    skill: "Multi-Source Search",
    name: "Perplexity Sonar",
    description: "AI-powered search with citation-backed answers.",
    method: "POST",
    path: "/perplexity/sonar",
    priceUSDC: "0.0036",
    requiredParams: ["model", "messages"],
    optionalParams: [],
    params: [
      {
        name: "model",
        required: true,
        type: "string",
        description: "Must always be exactly 'sonar'.",
        example: "sonar",
      },
      {
        name: "messages",
        required: true,
        type: "array",
        description: "Chat messages array. Build from the user prompt as [{role:'user', content:'<the full user question>'}].",
        example: [{ role: "user", content: "What are the latest developments in AI agents?" }],
      },
    ],
    aliases: ["perplexity", "sonar", "ai answer", "cited answer"],
    allowlisted: true,
  },

  // ── YouTube SERP ────────────────────────────────────────────────────────
  {
    id: "youtube_search",
    apiId: "youtube-search",
    skill: "YouTube SERP",
    name: "YouTube Search",
    description: "Search YouTube for videos, channels, and creators.",
    method: "GET",
    path: "/youtube/search",
    priceUSDC: "0.0024",
    requiredParams: ["q"],
    optionalParams: ["gl", "hl"],
    params: [
      {
        name: "engine",
        required: true,
        type: "string",
        description: "Must always be exactly 'youtube'.",
        example: "youtube",
      },
      {
        name: "q",
        required: true,
        type: "string",
        description: "YouTube search query.",
        example: "Solana development tutorial",
      },
      {
        name: "gl",
        required: false,
        type: "string",
        description: "Country code for regional results.",
        example: "us",
      },
      {
        name: "hl",
        required: false,
        type: "string",
        description: "Interface language code.",
        example: "en",
      },
    ],
    aliases: ["youtube", "video", "creator", "channel", "watch"],
    allowlisted: true,
  },

  // ── Crypto Market Data ───────────────────────────────────────────────────
  {
    id: "crypto_price",
    apiId: "coingecko-price",
    skill: "Crypto Market Data",
    name: "Crypto Price",
    description: "Current price for any cryptocurrency in any currency.",
    method: "GET",
    path: "/coingecko/simple/price",
    priceUSDC: "0.008",
    requiredParams: ["ids", "vs_currencies"],
    optionalParams: ["include_24hr_change"],
    params: [
      {
        name: "ids",
        required: true,
        type: "string",
        description: "CoinGecko coin ID — NOT the ticker symbol. Use the full lowercase slug name. 'bitcoin' not 'btc'. 'ethereum' not 'eth'. 'solana' not 'sol'. 'ripple' not 'xrp'. 'dogecoin' not 'doge'. Comma-separated for multiple coins.",
        example: "bitcoin,ethereum",
      },
      {
        name: "vs_currencies",
        required: true,
        type: "string",
        description: "Target currency code. Common: 'usd', 'eur', 'gbp', 'btc', 'eth'. Comma-separated for multiple.",
        example: "usd",
      },
      {
        name: "include_24hr_change",
        required: false,
        type: "boolean",
        description: "Set to true to include 24-hour price change percentage.",
        example: true,
      },
    ],
    aliases: ["crypto price", "coin price", "bitcoin price", "eth price", "token price"],
    allowlisted: true,
  },
  {
    id: "crypto_markets",
    apiId: "coingecko-markets",
    skill: "Crypto Market Data",
    name: "Crypto Market Rankings",
    description: "Top coins ranked by market cap with price, volume, and 24h change.",
    method: "GET",
    path: "/coingecko/coins/markets",
    priceUSDC: "0.008",
    requiredParams: ["vs_currency"],
    optionalParams: ["order", "per_page"],
    params: [
      {
        name: "vs_currency",
        required: true,
        type: "string",
        description: "Target currency code for prices. e.g. 'usd', 'eur'.",
        example: "usd",
      },
      {
        name: "order",
        required: false,
        type: "string",
        description: "Sort order. Use 'market_cap_desc' for top coins by market cap.",
        example: "market_cap_desc",
      },
      {
        name: "per_page",
        required: false,
        type: "integer",
        description: "Number of results per page. Max 250.",
        example: 10,
      },
    ],
    aliases: ["top coins", "market cap", "crypto ranking", "top crypto"],
    allowlisted: true,
  },
  {
    id: "crypto_coin_detail",
    apiId: "coingecko-coin",
    skill: "Crypto Market Data",
    name: "Coin Detail",
    description: "Full coin data including description, links, market data, and community stats.",
    method: "GET",
    path: "/coingecko/coins/{id}",
    priceUSDC: "0.008",
    requiredParams: ["id"],
    optionalParams: [],
    params: [
      {
        name: "id",
        required: true,
        type: "string",
        description: "CoinGecko coin slug ID — NOT ticker symbol. Use 'bitcoin' not 'BTC', 'ethereum' not 'ETH', 'solana' not 'SOL'.",
        example: "bitcoin",
      },
    ],
    aliases: ["coin info", "token info", "about bitcoin", "coin details"],
    allowlisted: true,
  },
  {
    id: "crypto_trending",
    apiId: "coingecko-trending",
    skill: "Crypto Market Data",
    name: "Trending Coins",
    description: "Top trending coin searches on CoinGecko right now. No parameters needed.",
    method: "GET",
    path: "/coingecko/search/trending",
    priceUSDC: "0.008",
    requiredParams: [],
    optionalParams: [],
    params: [],
    aliases: ["trending coins", "hot crypto", "trending tokens", "popular coins"],
    allowlisted: true,
  },
  {
    id: "crypto_news",
    apiId: "coingecko-news",
    skill: "Crypto Market Data",
    name: "Crypto News",
    description: "Latest cryptocurrency news articles. No parameters needed.",
    method: "GET",
    path: "/coingecko/news",
    priceUSDC: "0.008",
    requiredParams: [],
    optionalParams: [],
    params: [],
    aliases: ["crypto news", "bitcoin news", "blockchain news"],
    allowlisted: true,
  },

  // ── MarketPulse ──────────────────────────────────────────────────────────
  {
    id: "stock_metrics",
    apiId: "financial-metrics-snapshot",
    skill: "MarketPulse",
    name: "Stock Metrics Snapshot",
    description: "Real-time financial metrics for a stock (P/E ratio, EPS, etc.).",
    method: "GET",
    path: "/financial/financial-metrics/snapshot",
    priceUSDC: "0.0005",
    requiredParams: ["ticker"],
    optionalParams: [],
    params: [
      {
        name: "ticker",
        required: true,
        type: "string",
        description: "Stock ticker symbol in UPPERCASE.",
        example: "NVDA",
      },
    ],
    aliases: ["stock metrics", "pe ratio", "stock fundamentals", "financial metrics"],
    allowlisted: true,
  },
  {
    id: "stock_news",
    apiId: "financial-news",
    skill: "MarketPulse",
    name: "Stock News",
    description: "Recent news articles for a publicly traded company.",
    method: "GET",
    path: "/financial/news",
    priceUSDC: "0.0005",
    requiredParams: ["ticker"],
    optionalParams: ["limit"],
    params: [
      {
        name: "ticker",
        required: true,
        type: "string",
        description: "Stock ticker symbol in UPPERCASE.",
        example: "AAPL",
      },
      {
        name: "limit",
        required: false,
        type: "integer",
        description: "Number of news articles to return.",
        example: 10,
      },
    ],
    aliases: ["stock news", "company news", "nvda news", "earnings news"],
    allowlisted: true,
  },
  {
    id: "stock_financials",
    apiId: "financial-financials",
    skill: "MarketPulse",
    name: "Financial Statements",
    description: "Income statement, balance sheet, and cash flow for a stock.",
    method: "GET",
    path: "/financial/financials",
    priceUSDC: "0.002",
    requiredParams: ["ticker", "period"],
    optionalParams: [],
    params: [
      {
        name: "ticker",
        required: true,
        type: "string",
        description: "Stock ticker symbol in UPPERCASE.",
        example: "MSFT",
      },
      {
        name: "period",
        required: true,
        type: "string",
        description: "Reporting period. Must be exactly one of: 'annual', 'quarterly', or 'ttm' (trailing twelve months).",
        example: "annual",
      },
    ],
    aliases: ["income statement", "balance sheet", "cash flow", "financials", "revenue", "earnings"],
    allowlisted: true,
  },
  {
    id: "stock_insider_trades",
    apiId: "financial-insider-trades",
    skill: "MarketPulse",
    name: "Insider Trades",
    description: "Insider trading activity for a stock.",
    method: "GET",
    path: "/financial/insider-trades",
    priceUSDC: "0.002",
    requiredParams: ["ticker"],
    optionalParams: [],
    params: [
      {
        name: "ticker",
        required: true,
        type: "string",
        description: "Stock ticker symbol in UPPERCASE.",
        example: "TSLA",
      },
    ],
    aliases: ["insider trades", "insider buying", "insider selling"],
    allowlisted: true,
  },
  {
    id: "stock_filings",
    apiId: "financial-filings",
    skill: "MarketPulse",
    name: "SEC Filings",
    description: "SEC filing history for a publicly traded company.",
    method: "GET",
    path: "/financial/filings",
    priceUSDC: "0.002",
    requiredParams: ["ticker"],
    optionalParams: [],
    params: [
      {
        name: "ticker",
        required: true,
        type: "string",
        description: "Stock ticker symbol in UPPERCASE.",
        example: "NVDA",
      },
    ],
    aliases: ["sec filings", "10-k", "10-q", "annual report", "filings"],
    allowlisted: true,
  },

  // ── Prediction Market Data ───────────────────────────────────────────────
  {
    id: "polymarket_markets",
    apiId: "polymarket-markets",
    skill: "Prediction Market Data",
    name: "Polymarket Markets",
    description: "Search and list prediction markets on Polymarket.",
    method: "GET",
    path: "/polymarket/markets",
    priceUSDC: "0.01",
    requiredParams: [],
    optionalParams: ["search", "slug", "status"],
    params: [
      {
        name: "search",
        required: false,
        type: "string",
        description: "Fuzzy search query to find relevant markets.",
        example: "US election 2024",
      },
      {
        name: "slug",
        required: false,
        type: "string",
        description: "Exact market slug for a specific market.",
        example: "will-donald-trump-win-the-2024-us-presidential-election",
      },
      {
        name: "status",
        required: false,
        type: "string",
        description: "Filter by market status: 'active', 'resolved', or 'closed'.",
        example: "active",
      },
    ],
    aliases: ["polymarket", "prediction market", "odds", "market probabilities"],
    allowlisted: true,
  },
  {
    id: "polymarket_events",
    apiId: "polymarket-events",
    skill: "Prediction Market Data",
    name: "Polymarket Events",
    description: "Grouped Polymarket events ordered by volume.",
    method: "GET",
    path: "/polymarket/events",
    priceUSDC: "0.01",
    requiredParams: [],
    optionalParams: ["tag", "status"],
    params: [
      {
        name: "tag",
        required: false,
        type: "string",
        description: "Category tag to filter events (e.g. 'politics', 'crypto', 'sports').",
        example: "crypto",
      },
      {
        name: "status",
        required: false,
        type: "string",
        description: "Filter by event status: 'active', 'resolved'.",
        example: "active",
      },
    ],
    aliases: ["polymarket events", "top prediction markets", "high volume markets"],
    allowlisted: true,
  },
  {
    id: "kalshi_markets",
    apiId: "kalshi-markets",
    skill: "Prediction Market Data",
    name: "Kalshi Markets",
    description: "List and filter prediction markets on Kalshi.",
    method: "GET",
    path: "/kalshi/markets",
    priceUSDC: "0.01",
    requiredParams: [],
    optionalParams: ["ticker", "event_ticker", "status"],
    params: [
      {
        name: "ticker",
        required: false,
        type: "string",
        description: "Kalshi market ticker to filter to a specific market.",
        example: "KXBTC-25JAN",
      },
      {
        name: "event_ticker",
        required: false,
        type: "string",
        description: "Kalshi event ticker to get all markets in an event.",
        example: "KXBTC",
      },
      {
        name: "status",
        required: false,
        type: "string",
        description: "Filter by market status.",
        example: "open",
      },
    ],
    aliases: ["kalshi", "kalshi markets", "regulated prediction market"],
    allowlisted: true,
  },
]

export function getAvailableTools() {
  return PAID_API_CATALOG
}

export function getToolById(toolId: string) {
  return PAID_API_CATALOG.find((tool) => tool.id === toolId) ?? null
}

// Verify every catalogued tool has a matching template (fails loudly at startup)
const templateIds = new Set(API_TEMPLATES.map((t) => t.id))
for (const tool of PAID_API_CATALOG) {
  if (!templateIds.has(tool.apiId)) {
    throw new Error(
      `api-catalog: tool "${tool.id}" references template "${tool.apiId}" which is not registered in services.ts`
    )
  }
}
