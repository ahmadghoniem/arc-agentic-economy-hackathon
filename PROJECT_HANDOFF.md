# PROJECT HANDOFF

## 1. REPO IDENTITY

- **Project name:** `arc-economy-hackathon` (from `package.json`) — **implemented**
- **Main purpose:** Frontend demo console UI for OmniClaw-like paid API flow simulation (chat + guards + balances + activity panels) — **partial** (UI only, no real backend wiring in this repo)
- **Tech stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/base-ui style components — **implemented**
- **Package manager:** `pnpm` (`pnpm-lock.yaml`) — **implemented**
- **Framework:** Next.js App Router (`app/page.tsx`, `app/layout.tsx`) — **implemented**
- **Main app entry points:**
  - `app/page.tsx` -> renders `OmniClawConsole` — **implemented**
  - `components/layout/console-shell.tsx` -> root console layout — **implemented**
- **Important scripts from `package.json`:**
  - `dev`: `next dev --turbopack`
  - `build`: `next build`
  - `start`: `next start`
  - `lint`: `eslint`
  - `typecheck`: `tsc --noEmit`
  - `format`: `prettier --write "**/*.{ts,tsx}"`
- **How to run locally:** — **implemented**
  1. `pnpm install`
  2. `pnpm dev`
  3. Open `http://localhost:3000` (or next available port; currently observed as `3001`)
- **Required env vars:** none identified in code (`process.env` not used) — **missing/none required**
- **Optional env vars:** none identified in code — **unknown**

## 2. CURRENT USER FLOW

Actual working flow in this repo:
1. User opens console page (`app/page.tsx`).
2. User types into chat (`components/chat/chat-window.tsx`) or uses suggestions.
3. UI runs a simulated trace (inspect -> guard checks -> pay -> final message) with hardcoded tool steps and costs.
4. Header, guards, service catalog, integration status, and transactions panels display static/mock data.

OmniClaw demo capability matrix:

- **AI chat / agent command:** **implemented (simulated)**  
  - Files: `components/chat/chat-window.tsx`, `components/chat/chat-data.ts`
  - Route/component used: chat component only; no network/API call.
- **seller endpoint browsing:** **implemented (static)**  
  - Files: `components/services/service-catalog-sheet.tsx`, `components/services/service-data.ts`
  - Route/component used: sheet UI, static list.
- **inspect endpoint:** **partial (simulated only)**  
  - Files: `components/chat/chat-window.tsx`
  - Route/component used: simulated tool route string `/api/v1/x402/inspect` only.
- **pay endpoint:** **partial (simulated only)**  
  - Files: `components/chat/chat-window.tsx`
  - Route/component used: simulated tool route string `/api/v1/pay` only.
- **policy check:** **implemented (frontend simulation)**  
  - Files: `components/chat/chat-window.tsx`, `components/guards/guard-data.ts`, `components/guards/active-guards.tsx`
  - Route/component used: in-component staged trace; no policy API.
- **blocked payment:** **missing** (no blocked branch in chat/payment simulation)
- **successful payment:** **implemented (simulated)**  
  - Files: `components/chat/chat-window.tsx` (hardcoded confirmed outputs), `components/activity/activity-data.ts` (completed statuses)
- **service response:** **implemented (simulated)**  
  - Files: `components/chat/chat-window.tsx` (hardcoded data payload in `paymentTools.output`)
- **ArcScan proof:** **missing** (no ArcScan URL/proof link wiring)
- **EOA balance:** **implemented (static display)**  
  - Files: `components/wallet/wallet-data.ts`, `components/layout/header.tsx`
- **Circle balance:** **implemented (static display)**  
  - Files: `components/wallet/wallet-data.ts`, `components/layout/header.tsx`
- **Gateway balance:** **implemented (static display)**  
  - Files: `components/wallet/wallet-data.ts`, `components/layout/header.tsx`
- **deposits:** **implemented (static activity + nonfunctional input popover)**  
  - Files: `components/activity/deposits.tsx`, `components/activity/activity-data.ts`, `components/wallet/gateway-transfer-popover.tsx`
- **withdrawals:** **implemented (static activity + nonfunctional input popover)**  
  - Files: `components/activity/withdrawals.tsx`, `components/activity/activity-data.ts`, `components/wallet/gateway-transfer-popover.tsx`
- **transaction history:** **implemented (static)**  
  - Files: `components/activity/transactions.tsx`, `components/activity/activity-data.ts`
- **integration health:** **implemented (static)**  
  - Files: `components/services/integration-status-drawer.tsx`

## 3. FRONTEND STRUCTURE

- **dashboard page**
  - File: `app/page.tsx`
  - Does: renders console root component
  - Data: none
  - Source type: static component composition

- **console page**
  - File: `components/layout/console-shell.tsx`
  - Does: assembles header + left sidebar + chat + right sidebar + service sheet
  - Data: composed child component props/state only
  - Source type: static composition

- **header/navbar**
  - File: `components/layout/header.tsx`
  - Does: title, balances, refresh button animation, API browse trigger
  - Data: `walletBalances` from `components/wallet/wallet-data.ts`
  - Source type: mock/static

- **balance chips**
  - Files: `components/wallet/wallet-balance-badge.tsx`, `components/wallet/wallet-data.ts`
  - Does: render EOA/Circle/Gateway chips
  - Data: static array values
  - Source type: mock/static

- **chat panel**
  - File: `components/chat/chat-window.tsx`
  - Does: user input, simulated execution trace, assistant message
  - Data: internal state + static seed data from `components/chat/chat-data.ts`
  - Source type: mock/simulated (no API-backed calls)

- **payment timeline**
  - File: `components/chat/chat-window.tsx` (Execution Trace)
  - Does: step-by-step inspect/pay progress with tool cards
  - Data: hardcoded `inspectTools`, `paymentTools`, and step text
  - Source type: mock/simulated

- **transaction panel**
  - Files: `components/activity/transactions.tsx`, `components/activity/payments.tsx`
  - Does: tabbed payments/deposits/withdrawals list
  - Data: `activity-data.ts`
  - Source type: mock/static

- **deposits/withdrawals panel**
  - Files: `components/activity/deposits.tsx`, `components/activity/withdrawals.tsx`, `components/wallet/gateway-transfer-popover.tsx`
  - Does: display deposit/withdraw history; popover contains inputs/buttons without handlers
  - Data: static activity arrays
  - Source type: mock/static + nonfunctional form UI

- **seller/API browser**
  - Files: `components/services/service-catalog-sheet.tsx`, `components/services/service-data.ts`
  - Does: lists paid APIs and shows inspect icon button
  - Data: static service catalog
  - Source type: mock/static

- **guard/policy panel**
  - Files: `components/guards/active-guards.tsx`, `components/guards/guard-data.ts`
  - Does: render budget/rate/recipient/manual review items
  - Data: static guard values
  - Source type: mock/static

- **receipt/proof drawer**
  - Status: **missing**
  - Closest related UI: chat tool outputs with fake tx hashes in `components/chat/chat-window.tsx`

- **integration health panel**
  - File: `components/services/integration-status-drawer.tsx`
  - Does: expandable health rows ("Mode", "Auth", "OmniClaw configured", "AI (Featherless)")
  - Data: static `integrationRows` array
  - Source type: mock/static

## 4. API ROUTES IN THIS REPO

No Next.js API route files were found (`app/**/route.*` returns none).

- **Implemented API routes:** **missing**
- **Methods/paths/file paths:** none
- **Request/response shapes:** none in runtime API handlers
- **Calls to OmniClaw server:** none in code
- **Calls to Circle:** none in code
- **Mocked route references (string-only, not implemented):**
  - `/api/v1/x402/inspect` (in `components/chat/chat-window.tsx`)
  - `/api/v1/pay` (in `components/chat/chat-window.tsx`)
- **Error behavior for API handlers:** unknown (no handlers exist)

Important route search status:
- health/status/balance/wallet/gateway balance/transactions/pay/inspect/deposits/withdrawals/agent chat/AI provider/Gemini/Featherless: **no implemented route files found**

## 5. OMNICLAW SERVER INTEGRATION

Connection to real OmniClaw server:
- **Current status:** **missing**
- **Base URL env var:** none found
- **API client file:** none found
- **fetch/axios calls:** none found
- **auth/token usage:** none found
- **custom headers:** none found
- **route mapping:** only UI string references in chat trace

Capability breakdown:
- **OmniClaw server health**
  - Current file path: `components/services/integration-status-drawer.tsx`
  - Expected backend route: unknown
  - Status: displayed only (static)
- **EOA balance**
  - Current file path: `components/wallet/wallet-data.ts`
  - Expected backend route: unknown (likely `/balance`/`/wallet`)
  - Status: static mock
- **Circle wallet balance**
  - Current file path: `components/wallet/wallet-data.ts`
  - Expected backend route: unknown
  - Status: static mock
- **Gateway balance**
  - Current file path: `components/wallet/wallet-data.ts`
  - Expected backend route: unknown
  - Status: static mock
- **payments via OmniClaw API/transactions**
  - Current file path: `components/chat/chat-window.tsx`
  - Expected backend route: `/api/v1/pay` (string in UI simulation)
  - Status: simulated only
- **deposits**
  - Current file paths: `components/activity/deposits.tsx`, `components/wallet/gateway-transfer-popover.tsx`
  - Expected backend route: unknown
  - Status: static history + no submit handler
- **withdrawals**
  - Current file paths: `components/activity/withdrawals.tsx`, `components/wallet/gateway-transfer-popover.tsx`
  - Expected backend route: unknown
  - Status: static history + no submit handler
- **inspect**
  - Current file path: `components/chat/chat-window.tsx`
  - Expected backend route: `/api/v1/x402/inspect` (string in UI simulation)
  - Status: simulated only
- **pay**
  - Current file path: `components/chat/chat-window.tsx`
  - Expected backend route: `/api/v1/pay` (string in UI simulation)
  - Status: simulated only
- **transaction history**
  - Current file paths: `components/activity/transactions.tsx`, `components/activity/activity-data.ts`
  - Expected backend route: unknown
  - Status: static mock list

## 6. BALANCE SYSTEM

How balances are shown:
- Header maps over `walletBalances` from `components/wallet/wallet-data.ts`.
- Refresh button in `components/layout/header.tsx` only toggles spinner state; no refetch/network.

Balance details:

- **EOA balance**
  - Source file: `components/wallet/wallet-data.ts`
  - API route used: none
  - Source type: mock/static
  - Data shape: `{ label: "EOA", amount: "14.34 USDC", statusColor, copyValue }`

- **Circle balance**
  - Source file: `components/wallet/wallet-data.ts`
  - API route used: none
  - Source type: mock/static
  - Data shape: `{ label: "Circle", amount: "20 USDC", statusColor, copyValue }`

- **Gateway balance**
  - Source file: `components/wallet/wallet-data.ts`
  - API route used: none
  - Source type: mock/static
  - Data shape: `{ label: "Gateway", amount: "7.17 USDC", statusColor }`

- **gateway API balance:** missing
- **gateway on-chain balance:** missing
- **currency:** displayed as USDC strings
- **network:** displayed text references Arc Testnet (`components/chat/chat-window.tsx` footer), not programmatically sourced
- **refresh behavior:** UI-only spinner; no data fetch

## 7. PAYMENT / TRANSACTION SYSTEM

- **inspect flow**
  - Files: `components/chat/chat-window.tsx`
  - API route: simulated `/api/v1/x402/inspect`
  - Request shape (simulated): `{ endpoint }`
  - Response shape (simulated): `{ price, method, accepts }`
  - Status: mocked/simulated

- **pay flow**
  - Files: `components/chat/chat-window.tsx`
  - API route: simulated `/api/v1/pay`
  - Request shape (simulated): `{ endpoint, amount, idempotencyKey }`
  - Response shape (simulated): `{ status, txHash, route, data }`
  - Status: mocked/simulated

- **policy check flow**
  - Files: `components/chat/chat-window.tsx` (trace text), `components/guards/guard-data.ts` (display)
  - API routes: none
  - Status: frontend-only simulation

- **transaction creation**
  - Files: `components/chat/chat-window.tsx`
  - API routes: none (simulated updates only)
  - Status: mocked/simulated

- **transaction history**
  - Files: `components/activity/transactions.tsx`, `components/activity/activity-data.ts`
  - API routes: none
  - Status: mocked/static

- **blocked payment behavior**
  - Files: none implementing blocked branch
  - API routes: none
  - Status: missing

- **successful payment behavior**
  - Files: `components/chat/chat-window.tsx`, `components/activity/activity-data.ts`
  - API routes: none live
  - Status: mocked/simulated success

- **service response behavior**
  - Files: `components/chat/chat-window.tsx` (`paymentTools` output payloads)
  - API routes: none live
  - Status: mocked/simulated

- **ArcScan proof behavior**
  - Files: none
  - API routes: none
  - Status: missing

## 8. DEPOSIT / WITHDRAW SYSTEM

- **Deposit**
  - UI components: `components/activity/deposits.tsx`, `components/wallet/gateway-transfer-popover.tsx`
  - API route: none
  - Request body: none (no handler)
  - Response shape: none
  - Relation to Gateway balance: implied by popover text "EOA -> Gateway", but no state update logic
  - Status: partial (displayed mock history, no real action)

- **Withdraw**
  - UI components: `components/activity/withdrawals.tsx`, `components/wallet/gateway-transfer-popover.tsx`
  - API route: none
  - Request body: none (no handler)
  - Response shape: none
  - Relation to Gateway balance: implied by popover text "Gateway -> Circle", but no state update logic
  - Status: partial (displayed mock history, no real action)

If missing/partial, what UI currently expects:
- Popover collects an amount and has Deposit/Withdraw button labels, but no `onClick` transfer logic is connected to API or state mutation.

## 9. AI CHAT / AGENT COMMAND SYSTEM

- **Chat component:** `components/chat/chat-window.tsx`
- **AI API route:** missing
- **Provider client files:** missing
- **Command parser files:** missing (only simple `needsClarification` pattern for Twitter handle text)

Behavior details:
- **provider switch Gemini/Featherless:** **implemented in UI only**
  - File: `components/chat/chat-data.ts` (`modelGroups`)
  - No runtime provider call.
- **provider env vars:** none found
- **prompt/system instruction:** no external system prompt found; responses built by local helper functions
- **route used:** none live; only simulated tool route strings
- **how it decides what API to call:** no real routing engine; deterministic step simulation in `runDemo`
- **can inspect/pay:** only as simulated trace steps
- **parses user commands:** minimal heuristic (`needsClarification`) for missing twitter handle
- **uses mock responses:** yes (hardcoded outputs)
- **calls OmniClaw routes:** no (string labels only)

## 10. POLICY / GUARDS

- **daily budget:** displayed static (`guard-data.ts`) and referenced in chat trace text
- **rate limit:** displayed static (`guard-data.ts`) and referenced in chat trace text
- **recipients allowlist:** displayed static (`guard-data.ts`: `api.aisa.one`)
- **manual review threshold:** displayed static (`guard-data.ts`)
- **policy check route:** missing
- **frontend-only or backend-backed:** frontend-only
- **blocked payments stop before payment API call:** unknown/missing (no blocked branch implemented)

## 11. CIRCLE / ARC / X402 / GATEWAY DETAILS

- **Circle W3S:** missing
  - File path: none
  - Env var: none
  - API route: none
- **Circle Gateway:** displayed only/mocked
  - Files: `components/wallet/wallet-data.ts`, `components/wallet/gateway-transfer-popover.tsx`
  - Env var/API route: none
- **Circle Nanopayments:** displayed only/mocked (text + simulated flow)
  - Files: `components/chat/chat-window.tsx`
  - Env var/API route: none
- **x402:** displayed only/mocked
  - Files: `components/chat/chat-window.tsx`, `components/services/service-catalog-sheet.tsx`
  - Env var/API route: string-only `/api/v1/x402/inspect` in simulation
- **Arc Testnet:** displayed only
  - Files: `components/chat/chat-window.tsx` footer text
  - Env var/API route: none
- **ArcScan:** missing
  - File/env/route: none
- **EOA wallet:** displayed static only
  - Files: `components/wallet/wallet-data.ts`
  - Env var/API route: none
- **Gateway wallet:** displayed static only
  - Files: `components/wallet/wallet-data.ts`
  - Env var/API route: none
- **contract route:** missing
  - File/env/route: none
- **direct transfer fallback:** missing
  - File/env/route: none

## 12. MOCK DATA

- `components/wallet/wallet-data.ts`
  - Represents: EOA/Circle/Gateway balances and copy values
  - Replace with API data: yes
  - Replacement route: unknown (likely balance/wallet endpoints)

- `components/activity/activity-data.ts`
  - Represents: payments, deposits, withdrawals history
  - Replace with API data: yes
  - Replacement route: unknown (likely transactions/deposits/withdrawals endpoints)

- `components/guards/guard-data.ts`
  - Represents: guard config and current usage
  - Replace with API data: likely yes (or centralized policy config)
  - Replacement route: unknown (likely policy/status endpoints)

- `components/services/service-data.ts`
  - Represents: service catalog and pricing
  - Replace with API data: likely yes if server-managed catalog
  - Replacement route: unknown (service catalog endpoint)

- `components/services/integration-status-drawer.tsx` (`integrationRows`)
  - Represents: OmniClaw/Auth/AI integration health states
  - Replace with API data: yes
  - Replacement route: unknown (health/status endpoint)

- `components/chat/chat-window.tsx` (`inspectTools`, `paymentTools`, trace step text, final assistant message)
  - Represents: inspect/pay transaction execution and responses
  - Replace with API data: yes
  - Replacement route: simulated references `/api/v1/x402/inspect`, `/api/v1/pay`

- `components/chat/chat-data.ts` (`modelGroups`, endpoint list, suggestions)
  - Represents: provider labels/models and sample prompts
  - Replace with API data: optional (config-driven)
  - Replacement route: unknown

## 13. MISSING ESSENTIALS

### P0 (must fix before demo)

1. Implement actual API route layer (`app/api/...`) or wire frontend directly to backend proxy for:
   - inspect
   - pay
   - transactions
   - balances
   - health
2. Replace static EOA/Circle/Gateway balances with real fetch + refresh.
3. Wire chat actions to real inspect/pay APIs (instead of simulated timeline data).
4. Add blocked payment path from policy check and enforce stop before pay call.
5. Implement integration health from real backend checks (OmniClaw + AI provider).

### P1 (important if time)

1. Wire deposits/withdrawals submit actions to real API and update history/balances.
2. Add transaction proof links (ArcScan if available from backend).
3. Replace static service catalog with backend-provided endpoint metadata and prices.
4. Persist chat session/trace records (if needed for demo continuity).

### P2 (nice to have)

1. Improve command parsing beyond simple twitter-handle clarification.
2. Add explicit error/retry states for each execution step.
3. Add detail drawers for transaction objects and raw API responses.

## 14. RECOMMENDED NEXT STEPS

- [ ] Add backend route wrappers in Next app
  - files to edit: create `app/api/*/route.ts` files
  - API route involved: health, balances, inspect, pay, transactions, deposits, withdrawals
  - expected result: frontend has stable local routes for all required demo actions

- [ ] Replace header balances with live data
  - files to edit: `components/layout/header.tsx`, `components/wallet/wallet-data.ts` (or remove static dependency)
  - API route involved: balance/wallet route(s)
  - expected result: EOA/Circle/Gateway chips show backend values and refresh actually refetches

- [ ] Wire chat inspect/pay flow to real API calls
  - files to edit: `components/chat/chat-window.tsx`
  - API route involved: inspect + pay
  - expected result: execution trace reflects real responses, tx hashes, and failures

- [ ] Implement transaction/deposit/withdraw history loading
  - files to edit: `components/activity/transactions.tsx`, `components/activity/payments.tsx`, `components/activity/deposits.tsx`, `components/activity/withdrawals.tsx`
  - API route involved: transactions, deposits, withdrawals
  - expected result: right sidebar reflects backend history instead of static arrays

- [ ] Wire policy/guard checks to enforcement path
  - files to edit: `components/chat/chat-window.tsx`, `components/guards/*`
  - API route involved: policy check route (to be defined)
  - expected result: blocked requests stop before pay call and UI clearly shows reason

- [ ] Replace integration status drawer with live health check
  - files to edit: `components/services/integration-status-drawer.tsx`
  - API route involved: health/status route
  - expected result: OmniClaw and AI provider status is real-time and trustworthy

- [ ] Wire deposit/withdraw popover actions
  - files to edit: `components/wallet/gateway-transfer-popover.tsx`
  - API route involved: deposits/withdrawals
  - expected result: popover submits amount, updates balances/history, handles errors

## 15. ROUTE MAP TABLE

| Feature | UI Component | Current Data Source | Needed API Route | Current Status | Notes |
|---|---|---|---|---|---|
| EOA balance | `components/layout/header.tsx` + `wallet-balance-badge` | `components/wallet/wallet-data.ts` static | unknown (`/balance`/`/wallet` likely) | partial | Display exists, no live fetch |
| Circle balance | `components/layout/header.tsx` | `components/wallet/wallet-data.ts` static | unknown | partial | Display exists, no live fetch |
| Gateway balance | `components/layout/header.tsx` | `components/wallet/wallet-data.ts` static | unknown (`/gateway/balance` likely) | partial | Display exists, no live fetch |
| inspect | `components/chat/chat-window.tsx` trace | Hardcoded `inspectTools` | `/api/v1/x402/inspect` (simulated reference) | partial | Route string only; no handler/call |
| pay | `components/chat/chat-window.tsx` trace | Hardcoded `paymentTools` | `/api/v1/pay` (simulated reference) | partial | Route string only; no handler/call |
| transactions | `components/activity/transactions.tsx` | `components/activity/activity-data.ts` | unknown (`/transactions` likely) | partial | Static mock history |
| deposits | `components/activity/deposits.tsx` + transfer popover | `components/activity/activity-data.ts` + local UI state | unknown (`/deposits` likely) | partial | History static; submit missing |
| withdrawals | `components/activity/withdrawals.tsx` + transfer popover | `components/activity/activity-data.ts` + local UI state | unknown (`/withdrawals` likely) | partial | History static; submit missing |
| AI chat | `components/chat/chat-window.tsx` | In-memory state + static helpers | unknown (agent/chat route) | partial | No provider/backend call |
| integration health | `components/services/integration-status-drawer.tsx` | Static `integrationRows` | unknown (`/health`/`/status` likely) | partial | Static labels only |
| ArcScan proof | none | none | unknown | missing | No proof URL/data shown |
| policy guards | `components/guards/active-guards.tsx` + chat trace | `components/guards/guard-data.ts` + trace text | unknown (policy check route) | partial | Display + simulated pass only |

