# Environment Configuration Guide

## Quick Reference

OmniClaw uses two separate `.env` files:
- **Root `.env`** → Frontend (Next.js) + AI providers
- **`backend/.env`** → Python backend + Circle + Arc Testnet

---

## Frontend Environment (`.env`)

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `OMNICLAW_BACKEND_URL` | ✅ | `http://localhost:8090` | Python backend URL |
| `NEXT_PUBLIC_ARC_EXPLORER_URL` | ✅ | `https://testnet.arcscan.app` | ArcScan explorer for tx links |
| `GEMINI_API_KEY` | ⚠️ | — | Google AI Studio API key |
| `GEMINI_MODEL` | ❌ | `gemini-2.5-flash,gemini-2.0-flash` | Comma-separated model list |
| `FEATHERLESS_API_KEY` | ⚠️ | — | Featherless.ai API key |
| `FEATHERLESS_MODEL` | ❌ | `Qwen/Qwen2.5-72B-Instruct,meta-llama/Meta-Llama-3.1-8B-Instruct` | Must use `org/model` format |
| `FEATHERLESS_BASE_URL` | ❌ | `https://api.featherless.ai/v1` | OpenAI-compatible base URL |
| `AIVML_API_KEY` | ⚠️ | — | AIML API key |
| `AIVML_MODEL` | ❌ | `gpt-4o-mini,mistral-small` | Comma-separated model list |
| `AIVML_BASE_URL` | ❌ | `https://api.aimlapi.com/v1` | OpenAI-compatible base URL |

> ⚠️ = At least one AI provider key is required for the AI planner to work.

### AI Provider Key Sources

| Provider | Get Key At | Notes |
|----------|-----------|-------|
| Gemini | [aistudio.google.com](https://aistudio.google.com/) | Free tier available |
| Featherless | [featherless.ai](https://featherless.ai/) | Open-source models, pay-per-token |
| AIVML | [aimlapi.com](https://aimlapi.com/) | OpenAI-compatible, multiple model providers |

---

## Backend Environment (`backend/.env`)

### Circle W3S Configuration

| Variable | Required | Description |
|----------|:--------:|-------------|
| `CIRCLE_API_KEY` | ✅ | Circle developer console API key |
| `ENTITY_SECRET` | ⚠️ | Entity secret for payment signing (SDK flow) |
| `CIRCLE_WALLET_ID` | ✅ | Pre-created programmable wallet ID |
| `CIRCLE_WALLET_SET_ID` | ❌ | Wallet set for grouping (optional) |

### Arc Testnet Configuration

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `OMNICLAW_NETWORK` | ❌ | `ARC_TESTNET` | Network identifier |
| `ARC_RPC_URL` | ❌ | `https://rpc.testnet.arc.network` | Arc RPC endpoint |
| `ARC_EXPLORER_URL` | ❌ | `https://testnet.arcscan.app` | ArcScan explorer URL |
| `OMNICLAW_PRIVATE_KEY` | ❌ | — | Private key for gateway signing |

### Demo & Proof Configuration

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `SELLER_BASE_URL` | ❌ | `http://localhost:8000` | Local seller endpoint base |
| `OMNICLAW_FORCE_ONCHAIN_PROOF` | ❌ | `false` | Enable on-chain proof transfers |
| `OMNICLAW_PROOF_RECIPIENT` | ⚠️ | — | EVM address for proof transfers |

> ⚠️ = Required only when `OMNICLAW_FORCE_ONCHAIN_PROOF=true`

---

## Example Configurations

### Minimal (Gemini only, no payments)

```env
# .env
OMNICLAW_BACKEND_URL=http://localhost:8090
NEXT_PUBLIC_ARC_EXPLORER_URL=https://testnet.arcscan.app
GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-2.5-flash
```

### Full Demo (all providers + payments + proofs)

```env
# .env
OMNICLAW_BACKEND_URL=http://localhost:8090
NEXT_PUBLIC_ARC_EXPLORER_URL=https://testnet.arcscan.app

GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-2.5-flash,gemini-2.0-flash

FEATHERLESS_API_KEY=rc_...
FEATHERLESS_MODEL=Qwen/Qwen2.5-72B-Instruct,meta-llama/Meta-Llama-3.1-8B-Instruct
FEATHERLESS_BASE_URL=https://api.featherless.ai/v1

AIVML_API_KEY=10fbe...
AIVML_MODEL=gpt-4o-mini,mistral-small
AIVML_BASE_URL=https://api.aimlapi.com/v1
```

```env
# backend/.env
CIRCLE_API_KEY=LIVE_...
ENTITY_SECRET=...
CIRCLE_WALLET_ID=...
OMNICLAW_NETWORK=ARC_TESTNET
ARC_RPC_URL=https://rpc.testnet.arc.network
ARC_EXPLORER_URL=https://testnet.arcscan.app
OMNICLAW_FORCE_ONCHAIN_PROOF=true
OMNICLAW_PROOF_RECIPIENT=0x...
```

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Using short Featherless model names (`qwen3.5-plus`) | Use full format: `Qwen/Qwen2.5-72B-Instruct` |
| Missing `AIVML_BASE_URL` | Must be `https://api.aimlapi.com/v1` |
| Using `NEXT_PUBLIC_` prefix for AI keys | AI keys must NOT have `NEXT_PUBLIC_` prefix (server-side only) |
| Committing `.env` to git | Only commit `.env.example` with empty values |
