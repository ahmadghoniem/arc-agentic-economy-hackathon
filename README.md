# 🦀 OmniClaw Console

> **AI-Powered Payment Routing Console on Arc Testnet**
>
> An intelligent agent console that plans API workflows using multi-provider AI, executes real USDC payments through Circle W3S programmable wallets, and records every transaction on-chain with verifiable ArcScan proofs.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     OmniClaw Console                        │
│                    (Next.js 16 Frontend)                    │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │  Chat UI │  │  Guards  │  │ Wallet   │  │ Activity   │  │
│  │  Window  │  │  Panel   │  │ Balance  │  │ Feed       │  │
│  └────┬─────┘  └──────────┘  └──────────┘  └────────────┘  │
│       │                                                     │
│  ┌────┴─────────────────────────────────────────────────┐   │
│  │              AI Planner Layer (Server-Side)          │   │
│  │  ┌─────────┐  ┌────────────┐  ┌─────────┐          │   │
│  │  │ Gemini  │  │ Featherless│  │  AIVML   │          │   │
│  │  │ (Google)│  │ (Open-Src) │  │ (OpenAI) │          │   │
│  │  └─────────┘  └────────────┘  └─────────┘          │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         │                                   │
│  ┌──────────────────────┴───────────────────────────────┐   │
│  │           API Catalog & Tool Execution               │   │
│  │  knowledge · social · weather · market · products    │   │
│  └──────────────────────┬───────────────────────────────┘   │
└─────────────────────────┼───────────────────────────────────┘
                          │ HTTP (port 8090)
┌─────────────────────────┼───────────────────────────────────┐
│                         │                                   │
│            FastAPI Backend (Python)                         │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  OmniClaw    │  │  Seller Demo │  │  Paid API        │  │
│  │  Adapter     │  │  (Products,  │  │  Endpoints       │  │
│  │  (Circle W3S │  │   Weather,   │  │  (Search, Social │  │
│  │   + Guards)  │  │   Market)    │  │   Docs, etc.)    │  │
│  └──────┬───────┘  └──────────────┘  └──────────────────┘  │
│         │                                                   │
└─────────┼───────────────────────────────────────────────────┘
          │
    ┌─────┴──────────────────────────────┐
    │     Circle W3S + Arc Testnet       │
    │                                    │
    │  Programmable Wallet ──► USDC Pay  │
    │  Budget Guards ──► Spend Limits    │
    │  Recipient Guards ──► Allowlists   │
    │  On-Chain Proofs ──► ArcScan       │
    └────────────────────────────────────┘
```

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🤖 **Multi-Provider AI Planning** | Choose between Gemini, Featherless (open-source), or AIVML to plan API workflows |
| 💰 **Real USDC Payments** | Every API call triggers a micro-payment (0.0005–0.0015 USDC) via Circle W3S |
| 🛡️ **Policy Guards** | Budget limits and recipient allowlists enforced before every payment |
| 🔗 **On-Chain Proofs** | All transactions recorded on Arc Testnet with ArcScan explorer links |
| 🛒 **Smart Shopping** | Product discovery with conversational follow-up ("buy the 1st one") |
| 📊 **Live Activity Feed** | Real-time payment history with tx hashes, amounts, and explorer links |

---

## 📁 Project Structure

```
final-demo-omniclaw/
├── app/                          # Next.js App Router
│   ├── api/
│   │   ├── agent/                # AI planner API routes
│   │   │   ├── models/           # GET  → available AI models
│   │   │   ├── plan/             # POST → generate execution plan
│   │   │   ├── execute-plan/     # POST → run plan + payments
│   │   │   └── final-answer/     # POST → AI-summarized response
│   │   ├── economics/            # Wallet balance & transactions
│   │   └── omniclaw/             # Config status, health checks
│   ├── globals.css               # Tailwind + design tokens
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main page
│
├── components/
│   ├── chat/                     # Chat UI (chat-window.tsx)
│   ├── guards/                   # Budget & recipient guard panels
│   ├── wallet/                   # Balance display, deposit/withdraw
│   ├── activity/                 # Transaction activity feed
│   ├── layout/                   # Navbar, sidebar, footer
│   └── ui/                       # shadcn/ui primitives
│
├── lib/
│   ├── agent/                    # AI planning engine
│   │   ├── model-registry.ts     # Provider ↔ model mapping
│   │   ├── api-catalog.ts        # Paid API tool definitions
│   │   ├── ai-planner.ts         # Keyword → tool routing
│   │   ├── policy-guards.ts      # Guard enforcement logic
│   │   ├── client.ts             # HTTP client for backend
│   │   └── providers/
│   │       ├── gemini.ts         # Google Gemini integration
│   │       ├── featherless.ts    # Featherless AI (Qwen, Llama)
│   │       └── aivml.ts          # AIVML (GPT-4o-mini, Mistral)
│   ├── omniclaw/                 # OmniClaw SDK client wrappers
│   └── stores/                   # Zustand state management
│
├── backend/                      # Python FastAPI backend
│   ├── main.py                   # Route definitions
│   ├── omniclaw_adapter.py       # Circle W3S + OmniClaw SDK adapter
│   ├── seller_demo.py            # Demo API endpoints (products, weather, etc.)
│   ├── requirements.txt          # Python dependencies
│   ├── .env.example              # Backend env template
│   └── README.md                 # Backend-specific docs
│
├── docs/
│   └── design-decisions.md       # Architecture decisions
│
├── .env.example                  # Frontend env template
├── package.json                  # Node.js dependencies
└── tsconfig.json                 # TypeScript configuration
```

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20+ | Frontend runtime |
| pnpm | 10+ | Package manager |
| Python | 3.10+ | Backend runtime |

### 1. Clone & Install

```bash
# Clone the repository
git clone <repo-url> && cd final-demo-omniclaw

# Install frontend dependencies
pnpm install

# Create Python virtual environment
python -m venv .venv

# Activate virtual environment
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# macOS/Linux:
source .venv/bin/activate

# Install backend dependencies
pip install -r backend/requirements.txt
```

### 2. Configure Environment

#### Frontend `.env`

```bash
cp .env.example .env
```

```env
# Backend connection
OMNICLAW_BACKEND_URL=http://localhost:8090
NEXT_PUBLIC_ARC_EXPLORER_URL=https://testnet.arcscan.app

# AI Providers (at least one required)
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-2.5-flash,gemini-2.0-flash

FEATHERLESS_API_KEY=your_featherless_key
FEATHERLESS_MODEL=Qwen/Qwen2.5-72B-Instruct,meta-llama/Meta-Llama-3.1-8B-Instruct
FEATHERLESS_BASE_URL=https://api.featherless.ai/v1

AIVML_API_KEY=your_aivml_key
AIVML_MODEL=gpt-4o-mini,mistral-small
AIVML_BASE_URL=https://api.aimlapi.com/v1
```

#### Backend `backend/.env`

```bash
cp backend/.env.example backend/.env
```

```env
# Required
CIRCLE_API_KEY=your_circle_api_key
ENTITY_SECRET=your_entity_secret
CIRCLE_WALLET_ID=your_wallet_id

# Arc Testnet
OMNICLAW_NETWORK=ARC_TESTNET
ARC_RPC_URL=https://rpc.testnet.arc.network
ARC_EXPLORER_URL=https://testnet.arcscan.app

# On-chain proof mode (for demo/judges)
OMNICLAW_FORCE_ONCHAIN_PROOF=true
OMNICLAW_PROOF_RECIPIENT=0xYourProofRecipientAddress
```

### 3. Start the Application

```bash
# Terminal 1: Start the backend (port 8090)
uvicorn backend.main:app --host 127.0.0.1 --port 8090 --reload

# Terminal 2: Start the frontend (port 3000)
pnpm dev
```

Open **http://localhost:3000** in your browser.

---

## 🔌 API Provider Setup

### Getting API Keys

| Provider | Dashboard | Models Available | Base URL |
|----------|-----------|-----------------|----------|
| **Gemini** | [aistudio.google.com](https://aistudio.google.com/) | `gemini-2.5-flash`, `gemini-2.0-flash` | Built-in (Google SDK) |
| **Featherless** | [featherless.ai](https://featherless.ai/) | `Qwen/Qwen2.5-72B-Instruct`, `meta-llama/Meta-Llama-3.1-8B-Instruct` | `https://api.featherless.ai/v1` |
| **AIVML** | [aimlapi.com](https://aimlapi.com/) | `gpt-4o-mini`, `mistral-small` | `https://api.aimlapi.com/v1` |

> **Note:** Featherless uses `org/model` format (e.g., `Qwen/Qwen2.5-72B-Instruct`). Short names like `qwen` won't work.

### How Provider Selection Works

```
User selects provider in UI dropdown
         │
         ▼
┌──── "auto" ────┐    ┌── "gemini" ──┐    ┌── "featherless" ──┐    ┌── "aivml" ──┐
│ Tries all      │    │ Gemini only  │    │ Featherless only  │    │ AIVML only  │
│ providers in   │    │              │    │                   │    │             │
│ sequence       │    │              │    │                   │    │             │
└────────────────┘    └──────────────┘    └───────────────────┘    └─────────────┘
         │
         ▼
   AI generates execution plan
   (which tools to call, in what order)
         │
         ▼
   Plan shown to user → User confirms
         │
         ▼
   Tools executed → Payments via Circle W3S
         │
         ▼
   AI summarizes results → Final answer
```

---

## 💳 Payment Flow

Every API call in OmniClaw is a **paid micro-transaction**:

```
1. User asks: "What's the weather in Mumbai?"
                    │
2. AI plans:        ▼
   Tool: weather    Price: 0.0005 USDC
                    │
3. User confirms    ▼
                    │
4. Backend:         ▼
   ┌────────────────────────────────┐
   │  OmniClaw SDK → Circle W3S    │
   │  ┌──────────────────────┐     │
   │  │ Check budget guard   │     │
   │  │ Check recipient guard│     │
   │  │ Debit USDC wallet    │     │
   │  │ Execute API call     │     │
   │  │ Record on-chain proof│     │
   │  └──────────────────────┘     │
   └────────────────────────────────┘
                    │
5. Response:        ▼
   "Mumbai: 32°C, Partly Cloudy"
   
   Payment proof: 0x1bb01c...
   ArcScan: https://testnet.arcscan.app/tx/0x1bb01c...
```

### Paid API Catalog

| Tool | Endpoint | Price (USDC) | Description |
|------|----------|:------------:|-------------|
| Knowledge Search | `/api/search` | 0.0007 | Factual Q&A lookups |
| Social Profile | `/api/social-profile` | 0.0007 | Follower counts & profiles |
| Code & Docs | `/api/code-docs` | 0.0010 | Developer docs & code snippets |
| Market Data | `/api/market-data` | 0.0015 | Token/crypto price snapshots |
| Weather | `/api/weather` | 0.0005 | Location weather forecasts |
| Product Discovery | `/api/products` | 0.0009 | Shopping & product search |
| General Assistant | `/api/assistant` | 0.0005 | Catch-all AI responses |

---

## 🛡️ Policy Guards

OmniClaw enforces guards **before** every payment:

### Budget Guard
- Sets a daily USDC spend limit per wallet
- Prevents overspending in demo or production

### Recipient Guard
- Allowlists specific domains/addresses for payments
- Blocks unauthorized destinations (e.g., `app.stripe.com` is blocked by default)

---

## 🖥️ Backend API Reference

All backend endpoints return normalized JSON:

```json
{
  "ok": true,
  "unavailable": false,
  "blocked": false,
  "error": null,
  "data": { ... }
}
```

### Core Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/health` | SDK health check |
| `GET` | `/config/status` | Full configuration & capability report |
| `GET` | `/balance` | Wallet balances (EOA, Circle, Gateway) |
| `GET` | `/transactions` | Transaction history with ArcScan links |
| `GET` | `/resolve-tx` | Look up on-chain tx hash by Circle tx ID |
| `POST` | `/inspect` | Check if endpoint is payable + detect method |
| `POST` | `/pay` | Execute payment to endpoint |
| `POST` | `/deposit` | Deposit USDC into gateway |
| `POST` | `/withdraw` | Withdraw USDC from gateway |

### Guard Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/guards/budget` | Set daily budget limit |
| `POST` | `/guards/recipient` | Set recipient allowlist |

### Paid API Endpoints

| Method | Route | Query Param | Description |
|--------|-------|-------------|-------------|
| `GET` | `/api/search` | `q` | Knowledge search |
| `GET` | `/api/social-profile` | `name` | Social profile lookup |
| `GET` | `/api/code-docs` | `q` | Code & documentation |
| `GET` | `/api/market-data` | `q` | Market/token data |
| `GET` | `/api/weather` | `location` | Weather forecast |
| `GET` | `/api/products` | `q` or `query` | Product discovery |
| `GET` | `/api/assistant` | `q` or `query` | General assistant |

---

## 🔧 Frontend Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start Next.js dev server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm start` | Run production server |
| `pnpm lint` | ESLint checks |
| `pnpm typecheck` | TypeScript validation |
| `pnpm format` | Prettier formatting |

---

## 🐛 Troubleshooting

### "Unable to acquire lock" error

If `pnpm dev` fails with a lock error, the previous process left a stale lock:

```powershell
# Delete the stale lock file
Remove-Item -Recurse -Force .next\dev\lock

# If port is still in use, find and kill the process
netstat -ano | findstr :3000
taskkill /PID <pid> /F

# Then restart
pnpm dev
```

### Backend won't start

```powershell
# Make sure the virtual environment is activated
.\.venv\Scripts\Activate.ps1

# Verify dependencies are installed
pip install -r backend/requirements.txt

# Start with explicit host/port
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8090
```

### AI provider errors

- **Featherless:** Models must use full `org/model` format (e.g., `Qwen/Qwen2.5-72B-Instruct`)
- **AIVML:** Requires both `AIVML_API_KEY` and `AIVML_BASE_URL` 
- **Gemini:** Only requires `GEMINI_API_KEY`

### No on-chain proofs appearing

Ensure these are set in `backend/.env`:
```env
OMNICLAW_FORCE_ONCHAIN_PROOF=true
OMNICLAW_PROOF_RECIPIENT=0xYourAddress
```

---

## 📜 License

Built for the Arc Economy Hackathon.
>>>>>>> 2d1f91c (Integrate final demo frontend with OmniClaw backend and planner fixes)
