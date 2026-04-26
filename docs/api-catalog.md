# API Catalog Reference

## Overview

OmniClaw's AI planner routes user queries to **paid API tools**. Each tool has:
- A domain (weather, shopping, social, etc.)
- An HTTP endpoint on the backend
- A micro-price in USDC
- Keyword aliases for intent matching

---

## Tool Definitions

### Knowledge Search
| Field | Value |
|-------|-------|
| ID | `knowledge_search` |
| Domain | knowledge |
| Endpoint | `/api/search?q=...` |
| Price | 0.0007 USDC |
| Aliases | search, knowledge, who created, founder, fact lookup, who is, what is, history |
| Example | "Who created Linux?" → `Linus Torvalds` |

### Social Profile
| Field | Value |
|-------|-------|
| ID | `social_profile` |
| Domain | social |
| Endpoint | `/api/social-profile?name=...` |
| Price | 0.0007 USDC |
| Aliases | twitter, followers, profile, social, instagram, youtube |
| Example | "Linus Torvalds followers" → `213,840` |

### Code & Docs
| Field | Value |
|-------|-------|
| ID | `code_docs` |
| Domain | developer |
| Endpoint | `/api/code-docs?q=...` |
| Price | 0.0010 USDC |
| Aliases | docs, developer, github, code, documentation, api docs, reference |
| Example | "x402 docs" → Protocol documentation |

### Market Data
| Field | Value |
|-------|-------|
| ID | `market_data` |
| Domain | market |
| Endpoint | `/api/market-data?q=...` |
| Price | 0.0015 USDC |
| Aliases | market, price, token, trading, crypto, bitcoin, stock |
| Example | "USDC price" → `$1.00, +0% 24h` |

### Weather
| Field | Value |
|-------|-------|
| ID | `weather` |
| Domain | weather |
| Endpoint | `/api/weather?location=...` |
| Price | 0.0005 USDC |
| Aliases | weather, temperature, forecast, rain, climate |
| Example | "Weather in Delhi" → `33°C, Hazy` |

### Product Discovery
| Field | Value |
|-------|-------|
| ID | `product_discovery` |
| Domain | shopping |
| Endpoint | `/api/products?q=...` |
| Price | 0.0009 USDC |
| Aliases | jacket, shopping, buy, product, recommendation, purchase, order, get me, find me, shop, phone, laptop, headphone, shoe, watch, book, apple, gift, clothes, electronics, netflix, spotify |
| Example | "Buy me an apple" → Product list with prices, ratings, buy links |

### General Assistant
| Field | Value |
|-------|-------|
| ID | `general_assistant` |
| Domain | general |
| Endpoint | `/api/assistant?q=...` |
| Price | 0.0005 USDC |
| Aliases | help, assist, general, question, answer, explain, tell me, how to, can you |
| Example | "Explain blockchain" → AI-generated explanation |

### Blocked External
| Field | Value |
|-------|-------|
| ID | `blocked_external` |
| Domain | blocked |
| Endpoint | `https://app.stripe.com` |
| Price | N/A |
| Allowlisted | ❌ No |
| Purpose | Demonstrates policy guard blocking unauthorized destinations |

---

## Intent Matching

The AI planner uses a two-pass matching system:

1. **Keyword alias scan**: User message is scanned against each tool's `aliases` array
2. **AI classification**: If no alias matches, the AI provider classifies the query into the best-matching tool domain

Priority order: exact alias match → AI classification → general_assistant fallback

---

## Adding New Tools

To add a new paid API tool:

1. **Backend**: Add a new endpoint in `backend/seller_demo.py`
2. **Backend**: Register the route in `backend/main.py`
3. **Frontend**: Add the tool definition to `lib/agent/api-catalog.ts`:

```typescript
{
  id: "my_new_tool",
  name: "My New API",
  domain: "custom",
  description: "What this tool does.",
  endpoint: "http://localhost:8090/api/my-tool",
  method: "GET",
  priceUSDC: "0.0010",
  aliases: ["keyword1", "keyword2"],
  inputSchema: { q: "string" },
  outputExample: { result: "example" },
  requiresPayment: true,
  allowlisted: true,
}
```
