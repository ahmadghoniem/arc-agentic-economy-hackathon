# Frontend Architecture

## Overview

The OmniClaw Console frontend is built with **Next.js 16** (App Router) + **React 19** + **TypeScript** + **Tailwind CSS**.

---

## Component Architecture

```
page.tsx
  └── OmniClawConsole
        ├── Navbar
        │     ├── Provider selector (Gemini / Featherless / AIVML)
        │     ├── Model dropdown (auto-filtered by provider)
        │     └── Wallet connect status
        │
        ├── ChatWindow (main interaction area)
        │     ├── Message list (user + assistant + system)
        │     ├── Tool execution cards (payment amounts, status)
        │     ├── Plan confirmation dialog
        │     └── Message input + send button
        │
        ├── WalletPanel
        │     ├── Balance display (EOA / Circle / Gateway)
        │     ├── Deposit/Withdraw actions
        │     └── Network indicator (Arc Testnet)
        │
        ├── GuardsPanel
        │     ├── Budget guard controls
        │     └── Recipient guard controls
        │
        └── ActivityFeed
              ├── Transaction list
              ├── ArcScan explorer links
              └── Payment method labels
```

---

## AI Planner Pipeline

The frontend orchestrates a 4-step AI pipeline for every user message:

### Step 1: Plan (`/api/agent/plan`)
- Matches user intent to API catalog tools via keyword aliases
- AI generates a structured plan: which tools to call, in what order, with what params
- Returns estimated cost in USDC

### Step 2: Confirm (Client-side)
- Plan displayed to user with tool names, costs, and descriptions
- User confirms or rejects

### Step 3: Execute (`/api/agent/execute-plan`)
- Each tool in the plan is called sequentially
- Payment is triggered for each tool call via the backend `/pay` endpoint
- Tool responses are collected

### Step 4: Summarize (`/api/agent/final-answer`)
- AI provider generates a human-readable summary of all tool responses
- Fallback: deterministic formatter for clean output without AI

---

## Model Registry

Models are registered per provider in `lib/agent/model-registry.ts`:

```typescript
{
  gemini: [
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
    { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
  ],
  featherless: [
    { id: "Qwen/Qwen2.5-72B-Instruct", name: "Qwen 2.5 72B" },
    { id: "meta-llama/Meta-Llama-3.1-8B-Instruct", name: "Llama 3.1 8B" },
  ],
  aivml: [
    { id: "gpt-4o-mini", name: "GPT-4o Mini" },
    { id: "mistral-small", name: "Mistral Small" },
  ]
}
```

### Provider Selection Logic

When the user switches providers in the UI:
1. Model dropdown is filtered to show only that provider's models
2. First available model is auto-selected
3. "Auto" mode shows all models and tries providers in sequence

---

## State Management

State is managed with **Zustand** stores:

| Store | Purpose |
|-------|---------|
| Chat store | Message history, current plan, execution state |
| Wallet store | Balance state, deposit/withdraw status |
| Config store | Provider selection, model selection, guard config |

---

## API Routes (Next.js Server-Side)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/agent/models` | GET | Returns available models grouped by provider |
| `/api/agent/plan` | POST | Generate execution plan from user message |
| `/api/agent/execute-plan` | POST | Execute plan steps + trigger payments |
| `/api/agent/final-answer` | POST | AI-summarize tool results into final response |
| `/api/economics/balance` | GET | Proxy to backend `/balance` |
| `/api/economics/transactions` | GET | Proxy to backend `/transactions` |
| `/api/omniclaw/config` | GET | Proxy to backend `/config/status` |

---

## Key Design Decisions

### 1. Server-side AI calls
All AI provider calls happen in Next.js API routes (server-side), not in the browser. This keeps API keys secure.

### 2. Deterministic fallback
If the AI provider fails or times out (25s limit), the system uses a deterministic formatter that converts any JSON tool response into clean, labeled text.

### 3. Product memory
When the user asks to "buy the 1st one", the chat window maintains a `lastProductResultsRef` that stores the most recent product search results, enabling conversational follow-up purchases.

### 4. Provider-scoped model dropdown
The model dropdown only shows models belonging to the currently selected provider, preventing user confusion.

---

## Styling

- **Tailwind CSS v4** with CSS-first configuration
- **shadcn/ui** primitives for consistent components
- Dark-mode-first design with `next-themes`
- **Phosphor Icons** for consistent iconography
