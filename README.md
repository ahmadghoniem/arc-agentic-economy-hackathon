# OmniClaw Console

OmniClaw Console is a Next.js agent-payment workspace for planning paid API workflows, reviewing the plan with a user, executing x402-style payments through OmniClaw, and showing wallet/activity state in one interface.

The app combines:

- A chat-first agent flow for planning and executing paid API calls.
- AI provider routing for Gemini, Featherless, and AIVML.
- OmniClaw proxy routes for wallet health, balances, deposits, withdrawals, inspect, pay, and activity.
- A dark console UI with chat, execution trace, active guards, service catalog, wallet balances, and gateway activity.
- Arc/Circle-oriented unit economics and transaction proof surfaces.

## Current Product Flow

1. The user asks for a task in the chat composer.
2. The assistant sends a short acknowledgement while planning starts.
3. The planner maps the request to allowlisted paid API tools.
4. The plan card shows the selected tools, estimated cost, and reasons.
5. The user confirms before any payment is executed.
6. The execution route inspects each endpoint, runs policy checks, pays through OmniClaw, and captures responses.
7. The execution trace replays inspect, guard, and payment steps in the UI.
8. The final answer is generated from the executed API responses.
9. Wallet balances and activity panels can be refreshed from the header.

## Architecture

```text
Next.js app
  app/page.tsx
    -> components/omniclaw-console.tsx
    -> components/layout/console-shell.tsx

UI surfaces
  components/chat          Chat, plan confirmation, execution trace
  components/activity      Payments, deposits, withdrawals
  components/guards        Active wallet/policy guard display
  components/services      Service catalog and system status
  components/wallet        EOA, Circle, and Gateway balance controls
  components/economics     Per-call unit economics

Agent layer
  lib/agent/api-catalog.ts       Paid API tool catalog
  lib/agent/ai-planner.ts        Provider + fallback planning logic
  lib/agent/model-registry.ts    Provider/model availability
  lib/agent/providers/*          Gemini, Featherless, AIVML adapters
  app/api/agent/*                Planner, execution, model, and answer routes

OmniClaw layer
  lib/omniclaw/client.ts         OmniClaw API client
  lib/omniclaw/services.ts       Paid endpoint templates
  app/api/omniclaw/*             Next.js proxy routes
  lib/stores/omniclaw-store.ts   Client-side wallet/activity/execution state
```

## Key Features

| Feature | Current behavior |
| --- | --- |
| Agent planning | Routes prompts to allowlisted paid API tools using provider planning plus fallback matching. |
| User confirmation | No paid workflow executes until the user confirms the generated plan. |
| x402 inspect/pay | Server routes call OmniClaw inspect and pay endpoints for each selected API. |
| Wallet controls | Header displays EOA, Circle, and Gateway balances, with deposit/withdraw controls. |
| Policy guards | Active guard panel reflects wallet policy and execution guard results. |
| Activity feed | Payments, deposits, withdrawals, transaction ids, and ArcScan links are surfaced in the console. |
| Service catalog | Skill metadata from `agent-skills/*/data.json` drives visible service categories and prompt suggestions. |
| Unit economics | Base/Solana gas estimates are compared against gateway-style micropayment economics. |

## Project Structure

```text
app/
  api/
    agent/
      models/              GET available provider models
      preamble/            POST short acknowledgement
      plan/                POST execution plan
      execute-plan/        POST confirmed plan execution
      final-answer-stream/ POST final answer stream
    economics/
      base-gas/            GET live Base gas estimate
      solana-gas/          GET Solana reference fee estimate
    omniclaw/
      health/              GET OmniClaw health
      address/             GET wallet addresses
      balance/             GET normalized backend balance
      balance-detail/      GET detailed wallet/gateway balances
      config-status/       GET backend configuration status
      deposit/             POST gateway deposit
      withdraw/            POST gateway withdrawal
      inspect/             POST payable endpoint inspect
      pay/                 POST paid endpoint execution
      transactions/        GET recent transaction activity
      explorer/            GET ArcScan-derived snapshot
components/
  activity/                Gateway activity panels
  chat/                    Chat window, composer, plan card, trace
  economics/               Unit economics block
  guards/                  Active guard panel
  layout/                  Console shell, sidebars, header
  services/                Service catalog and system status
  ui/                      Local UI primitives
  wallet/                  Balance badges and gateway transfer control
lib/
  agent/                   Planner, provider adapters, catalog, formatting
  explorer/                ArcScan helpers
  omniclaw/                OmniClaw client/service helpers
  services/                Skill catalog metadata
  storage/                 Chat localStorage helpers
  stores/                  Zustand app state
docs/
  design-decisions.md      Architecture and change log
```

## Environment

Create `.env.local` in the project root.

```env
# OmniClaw backend/proxy targets
OMNICLAW_BACKEND_URL=http://localhost:8090
OMNICLAW_API_URL=http://localhost:8080

# Token accepted by the OmniClaw API service.
# OMNICLAW_AGENT_TOKEN is also supported.
OMNICLAW_API_TOKEN=your_omniclaw_token

# Optional ArcScan endpoint override
ARCSCAN_API_URL=https://testnet.arcscan.app/api

# AI providers
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-2.5-flash,gemini-2.0-flash

FEATHERLESS_API_KEY=your_featherless_key
FEATHERLESS_MODEL=qwen3.5-plus,claude-haiku-4-5,nemotron-super-free
FEATHERLESS_BASE_URL=https://api.featherless.ai/v1

AIVML_API_KEY=your_aivml_key
AIVML_MODEL=gpt-4o-mini,mistral-small
AIVML_BASE_URL=https://api.aimlapi.com/v1
```

At least one AI provider should be configured for provider-backed planning. The fallback planner can still handle supported prompt patterns when provider planning is unavailable.

## Quick Start

```powershell
pnpm install
pnpm dev
```

Open:

```text
http://localhost:3000
```

For production checks:

```powershell
pnpm typecheck
pnpm lint
pnpm build
```

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the Next.js dev server with Turbopack. |
| `pnpm build` | Build the production app. |
| `pnpm start` | Start the production server after a build. |
| `pnpm lint` | Run ESLint. |
| `pnpm typecheck` | Run TypeScript without emitting files. |
| `pnpm format` | Format TypeScript and TSX files with Prettier. |

## API Catalog

The paid tool catalog lives in `lib/agent/api-catalog.ts`. It defines:

- tool id and display name
- domain/category
- endpoint URL
- HTTP method
- price in USDC
- aliases for fallback matching
- input schema and output example
- payment and allowlist flags

Visible service metadata and prompt suggestions come from `agent-skills/*/data.json` through `lib/services/skill-catalog.ts`.

## Payment And Execution Notes

- Planning is separate from execution.
- The UI requires user confirmation before calling `/api/agent/execute-plan`.
- Execution validates that each tool is allowlisted.
- Inspect and pay are routed through `/api/omniclaw/inspect` and `/api/omniclaw/pay`.
- Gateway activity can show payments, deposits, withdrawals, transaction ids, and ArcScan links.
- The final answer is based on API results; payment/activity details are handled by the console UI rather than being the core answer content.

## Troubleshooting

### Dev server lock

If the dev server reports a stale lock:

```powershell
Remove-Item -Recurse -Force .next\dev\lock
pnpm dev
```

If port 3000 is occupied:

```powershell
netstat -ano | findstr :3000
taskkill /PID <pid> /F
```

### OmniClaw auth errors

Check that one of these is set:

```env
OMNICLAW_API_TOKEN=...
OMNICLAW_AGENT_TOKEN=...
```

Also confirm `OMNICLAW_API_URL` points to the running OmniClaw service.

### Backend proxy unavailable

Routes that use `app/api/omniclaw/_proxy.ts` call `OMNICLAW_BACKEND_URL`, defaulting to:

```text
http://localhost:8090
```

Start that backend or update `OMNICLAW_BACKEND_URL`.

### Model selector is empty

Set at least one provider key:

```env
GEMINI_API_KEY=...
FEATHERLESS_API_KEY=...
AIVML_API_KEY=...
```

Then restart `pnpm dev`.

## Documentation

- `docs/design-decisions.md` tracks architecture decisions and meaningful changes.
- `docs/api-catalog.md` documents how paid API tools are represented.
- `docs/frontend-architecture.md` contains frontend architecture notes.
- `docs/environment-setup.md` contains additional environment setup details.

## License

Built for the Arc Economy Hackathon.
