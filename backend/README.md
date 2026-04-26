# 🦀 OmniClaw Backend Adapter

> FastAPI service that wraps the official `omniclaw` Python SDK and exposes a normalized HTTP API for the frontend console.

## Architecture

```
Frontend (Next.js)
      │
      ▼ HTTP :8090
┌─────────────────────────────────────────────┐
│             FastAPI Backend                  │
│                                             │
│  ┌───────────────────┐  ┌───────────────┐   │
│  │ OmniClaw Adapter  │  │  Seller Demo  │   │
│  │                   │  │               │   │
│  │ • Circle W3S      │  │ • Products    │   │
│  │ • Budget Guards   │  │ • Weather     │   │
│  │ • Recipient Guards│  │ • Market Data │   │
│  │ • Nanopayments    │  │ • Search      │   │
│  │ • On-chain Proofs │  │ • Social      │   │
│  └────────┬──────────┘  │ • Code Docs   │   │
│           │             │ • Assistant   │   │
│           ▼             └───────────────┘   │
│   Circle W3S API                            │
│   Arc Testnet RPC                           │
└─────────────────────────────────────────────┘
```

## Setup

### 1. Create Virtual Environment

```powershell
# From the project root
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
```

### 2. Configure Environment

```powershell
Copy-Item backend\.env.example backend\.env
```

Edit `backend/.env` with your real credentials:

| Variable | Required | Description |
|----------|----------|-------------|
| `CIRCLE_API_KEY` | ✅ | Circle developer API key |
| `ENTITY_SECRET` | ⚠️ | Required for SDK-based payment signing |
| `CIRCLE_WALLET_ID` | ✅ | Pre-created Circle programmable wallet |
| `CIRCLE_WALLET_SET_ID` | ❌ | Optional wallet set for grouping |
| `OMNICLAW_NETWORK` | ❌ | Default: `ARC_TESTNET` |
| `ARC_RPC_URL` | ❌ | Default: `https://rpc.testnet.arc.network` |
| `ARC_EXPLORER_URL` | ❌ | Default: `https://testnet.arcscan.app` |
| `OMNICLAW_PRIVATE_KEY` | ❌ | For gateway signing flows |
| `SELLER_BASE_URL` | ❌ | Default: `http://localhost:8000` |
| `OMNICLAW_FORCE_ONCHAIN_PROOF` | ❌ | `true` to enable proof-of-payment transfers |
| `OMNICLAW_PROOF_RECIPIENT` | ⚠️ | Required when proof mode is `true` |

> ⚠️ = Required only in certain configurations

### 3. Run the Backend

```powershell
uvicorn backend.main:app --host 127.0.0.1 --port 8090 --reload
```

Swagger docs available at: **http://localhost:8090/docs**

---

## API Reference

### Normalized Response Format

Every endpoint returns this structure:

```json
{
  "ok": true,
  "unavailable": false,
  "blocked": false,
  "error": null,
  "data": { ... }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `ok` | bool | Whether the operation succeeded |
| `unavailable` | bool | SDK method not available |
| `blocked` | bool | Blocked by policy guard |
| `error` | string\|null | Error message if failed |
| `data` | object | Response payload |

---

### Core Endpoints

#### `GET /health`
SDK installation and configuration health check.

**Response `data`:**
```json
{
  "sdk_installed": true,
  "circle_api_key_present": true,
  "entity_secret_present": true,
  "wallet_id_configured": true,
  "network": "ARC_TESTNET",
  "supported_methods": ["pay", "get_balance", ...]
}
```

#### `GET /config/status`
Detailed capability report showing which features are available.

#### `GET /balance`
Returns all wallet balances (EOA, Circle custodial, and gateway).

**Response `data`:**
```json
{
  "wallet_id": "abc-123",
  "network": "ARC_TESTNET",
  "eoa_address": "0x...",
  "balances": {
    "eoa_usdc": "5.00",
    "circle_wallet_usdc": "40.00",
    "gateway_usdc": "0.00"
  }
}
```

#### `GET /transactions`
Lists recent transactions with ArcScan explorer links.

#### `POST /inspect`
Check if an endpoint is payable and detect the payment method.

**Request:**
```json
{ "endpoint": "http://localhost:8090/api/weather" }
```

#### `POST /pay`
Execute a payment to an endpoint.

**Request:**
```json
{
  "endpoint": "http://localhost:8090/api/weather",
  "amount": "0.0005",
  "purpose": "Weather API call"
}
```

**Response `data`:**
```json
{
  "status": "confirmed",
  "payment_executed": true,
  "amount": "0.0005",
  "tx_hash": "0x1bb01c...",
  "arcscan_url": "https://testnet.arcscan.app/tx/0x1bb01c..."
}
```

#### `POST /deposit`
Deposit USDC into the nanopayment gateway.

#### `POST /withdraw`
Withdraw USDC from the nanopayment gateway.

---

### Guard Endpoints

#### `POST /guards/budget`
Set a daily spending limit.

```json
{ "daily_limit": "10.00" }
```

#### `POST /guards/recipient`
Set an allowlist for payment recipients.

```json
{
  "domains": ["localhost"],
  "addresses": ["0x..."]
}
```

---

### Paid API Endpoints

These return demo data for the hackathon showcase:

| Endpoint | Query | Example |
|----------|-------|---------|
| `GET /api/search?q=...` | Knowledge query | `/api/search?q=who+created+linux` |
| `GET /api/social-profile?name=...` | Person/entity | `/api/social-profile?name=elon+musk` |
| `GET /api/code-docs?q=...` | Tech query | `/api/code-docs?q=x402+protocol` |
| `GET /api/market-data?q=...` | Token/symbol | `/api/market-data?q=USDC` |
| `GET /api/weather?location=...` | City/region | `/api/weather?location=Mumbai` |
| `GET /api/products?q=...` | Shopping query | `/api/products?q=buy+me+an+apple` |
| `GET /api/assistant?q=...` | General query | `/api/assistant?q=help+me` |

---

## Payment Flow Internals

```
POST /pay
  │
  ├── 1. Inspect endpoint (detect_method, can_pay)
  │     └── Blocked domains check (app.stripe.com → reject)
  │
  ├── 2. Attempt nanopayment via OmniClaw SDK
  │     ├── Success → return tx_hash + ArcScan link
  │     └── Insufficient gateway balance → fallback
  │
  ├── 3. Fallback: Custodial debit
  │     ├── Run simulate() to check guards
  │     ├── Verify Circle wallet balance
  │     └── Record as custodial payment
  │
  └── 4. Optional: On-chain proof transfer
        ├── If OMNICLAW_FORCE_ONCHAIN_PROOF=true
        └── Executes a mirror transfer to proof recipient
            with real tx_hash + ArcScan link
```

---

## Seller Demo Mode

The backend includes a seller demo that can serve paywalled endpoints:

```powershell
# Manual CLI start
omniclaw-cli serve --price 0.01 --endpoint /ping --port 8000
```

Or via the API:
```bash
curl -X POST http://localhost:8090/seller/start-demo \
  -H "Content-Type: application/json" \
  -d '{"price": "0.01", "endpoint": "/ping", "port": 8000}'
```

---

## Security Notes

- All Circle API keys and entity secrets stay server-side only
- Frontend uses `OMNICLAW_BACKEND_URL` (non-public) for backend communication
- AI provider keys are server-side only (no `NEXT_PUBLIC_` prefix)
- ArcScan links are returned only when real tx hashes exist
- `app.stripe.com` is blocked by default in demo policy
