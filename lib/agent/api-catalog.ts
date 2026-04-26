export type PaidApiTool = {
  id: string
  name: string
  domain: string
  description: string
  endpoint: string
  method: "GET" | "POST"
  priceUSDC: string | null
  aliases: string[]
  inputSchema: Record<string, unknown>
  outputExample: Record<string, unknown>
  requiresPayment: boolean
  allowlisted: boolean
}

export const PAID_API_CATALOG: PaidApiTool[] = [
  {
    id: "knowledge_search",
    name: "Knowledge Search API",
    domain: "knowledge",
    description: "Find factual answers and entities for general knowledge queries.",
    endpoint: "http://localhost:8090/api/search",
    method: "GET",
    priceUSDC: "0.0007",
    aliases: ["search", "knowledge", "who created", "founder", "created", "fact lookup", "who is", "what is", "history"],
    inputSchema: { q: "string" },
    outputExample: {
      query: "Who created Linux?",
      answer: "Linux was created by Linus Torvalds.",
      entity: "Linus Torvalds",
    },
    requiresPayment: true,
    allowlisted: true,
  },
  {
    id: "social_profile",
    name: "Social Profile API",
    domain: "social",
    description: "Get social profile follower count for a person or entity.",
    endpoint: "http://localhost:8090/api/social-profile",
    method: "GET",
    priceUSDC: "0.0007",
    aliases: ["twitter", "x followers", "followers", "profile", "social", "instagram", "youtube"],
    inputSchema: { name: "string" },
    outputExample: {
      name: "Linus Torvalds",
      platform: "X/Twitter",
      followers: 213840,
    },
    requiresPayment: true,
    allowlisted: true,
  },
  {
    id: "code_docs",
    name: "Code and Docs API",
    domain: "developer",
    description: "Fetch code/doc snippets and developer references.",
    endpoint: "http://localhost:8090/api/code-docs",
    method: "GET",
    priceUSDC: "0.0010",
    aliases: ["docs", "developer", "github", "code", "documentation", "api docs", "reference"],
    inputSchema: { q: "string" },
    outputExample: {
      query: "x402 docs",
      result: "x402 is a paid HTTP pattern using 402 responses and signed payment headers.",
    },
    requiresPayment: true,
    allowlisted: true,
  },
  {
    id: "market_data",
    name: "Market Data API",
    domain: "market",
    description: "Get market/token pricing snapshots for requested symbols.",
    endpoint: "http://localhost:8090/api/market-data",
    method: "GET",
    priceUSDC: "0.0015",
    aliases: ["market", "price", "token", "trading", "data", "crypto", "bitcoin", "stock"],
    inputSchema: { q: "string" },
    outputExample: {
      query: "USDC",
      symbol: "USDC",
      priceUsd: 1,
      change24hPct: 0,
    },
    requiresPayment: true,
    allowlisted: true,
  },
  {
    id: "weather",
    name: "Weather API",
    domain: "weather",
    description: "Get weather and forecast summary for a location.",
    endpoint: "http://localhost:8090/api/weather",
    method: "GET",
    priceUSDC: "0.0005",
    aliases: ["weather", "temperature", "forecast", "rain", "climate"],
    inputSchema: { location: "string" },
    outputExample: {
      location: "Delhi",
      temperatureC: 33,
      condition: "Hazy",
    },
    requiresPayment: true,
    allowlisted: true,
  },
  {
    id: "product_discovery",
    name: "Product Discovery API",
    domain: "shopping",
    description: "Find purchasable products and ranked recommendations by query. Supports jackets, phones, laptops, headphones, shoes, watches, books, subscriptions, games, coffee, and more.",
    endpoint: "http://localhost:8090/api/products",
    method: "GET",
    priceUSDC: "0.0009",
    aliases: [
      "jacket", "jackets", "shopping", "buy", "product", "best", "recommendation",
      "purchase", "order", "get me", "find me", "shop", "store",
      "phone", "laptop", "headphone", "shoe", "watch", "book", "subscription",
      "game", "coffee", "apple", "gift", "clothes", "electronics",
      "chatgpt", "netflix", "spotify", "premium",
    ],
    inputSchema: { q: "string" },
    outputExample: {
      query: "buy me an apple",
      results: [
        {
          name: "Fuji Premium Organic Apples (1kg)",
          brand: "FreshFarm",
          category: "Fresh Fruit",
          priceUsd: 3.49,
          rating: 4.9,
          buyUrl: "https://demo.store/products/fuji-organic-apples",
        },
      ],
    },
    requiresPayment: true,
    allowlisted: true,
  },
  {
    id: "product_purchase",
    name: "Product Purchase API",
    domain: "shopping",
    description: "Finalize checkout for a selected product after discovery.",
    endpoint: "http://localhost:8090/api/product-purchase",
    method: "POST",
    priceUSDC: "1.0000",
    aliases: [
      "buy this",
      "purchase this",
      "checkout",
      "place order",
      "confirm order",
      "first one buy",
      "second one buy",
      "third one buy",
    ],
    inputSchema: { name: "string", buyUrl: "string", priceUsd: "number", query: "string" },
    outputExample: {
      status: "purchased",
      orderId: "abc123",
      name: "Item Pro Edition",
      priceUsd: 7.99,
      buyUrl: "https://demo.store/products/item-pro",
    },
    requiresPayment: true,
    allowlisted: true,
  },
  {
    id: "general_assistant",
    name: "AI General Assistant API",
    domain: "general",
    description: "Catch-all AI assistant for any query that doesn't match a specific domain. Generates helpful responses, answers questions, and handles miscellaneous requests.",
    endpoint: "http://localhost:8090/api/assistant",
    method: "GET",
    priceUSDC: "0.0005",
    aliases: [
      "help", "assist", "general", "question", "answer", "explain",
      "tell me", "how to", "can you", "please", "want", "need",
    ],
    inputSchema: { q: "string" },
    outputExample: {
      query: "help me with something",
      answer: "Based on our knowledge base, here is what I found.",
      source: "omniclaw-assistant",
    },
    requiresPayment: true,
    allowlisted: true,
  },
  {
    id: "blocked_external",
    name: "Blocked External API",
    domain: "blocked",
    description: "External destination intentionally blocked by policy.",
    endpoint: "https://app.stripe.com",
    method: "GET",
    priceUSDC: null,
    aliases: ["stripe", "blocked", "external"],
    inputSchema: {},
    outputExample: { blocked: true },
    requiresPayment: true,
    allowlisted: false,
  },
]

export function getAvailableTools() {
  return PAID_API_CATALOG
}

export function getAllowlistedTools() {
  return PAID_API_CATALOG.filter((tool) => tool.allowlisted)
}

export function getToolById(toolId: string) {
  return PAID_API_CATALOG.find((tool) => tool.id === toolId)
}
