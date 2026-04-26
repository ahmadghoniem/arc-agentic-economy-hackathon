# OmniClaw Main Demo

Frontend console + backend adapter for OmniClaw hackathon demo flows.

## Stack

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS
- Backend: FastAPI adapter (`backend/`) around OmniClaw Python package
- Package managers:
  - Frontend: `pnpm`
  - Backend: `pip` (`requirements.txt`)

## Project Structure

- `app/`, `components/`, `lib/` -> Next.js frontend
- `backend/` -> FastAPI OmniClaw adapter
- `.env.example` -> frontend env template
- `backend/.env.example` -> backend env template

## Prerequisites

- Node.js 20+
- pnpm 10+
- Python 3.10+

## Environment Variables

Do not commit real secrets. Keep only example values in `*.example`.

### Frontend (`.env`)

Create local env:

```powershell
Copy-Item .env.example .env
```

Required/used keys:

- `OMNICLAW_BACKEND_URL` (default: `http://localhost:8090`)
- `NEXT_PUBLIC_ARC_EXPLORER_URL` (default: `https://testnet.arcscan.app`)

Provider keys (server-side usage; leave empty if not used):

- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `FEATHERLESS_API_KEY`
- `FEATHERLESS_MODEL`
- `FEATHERLESS_BASE_URL`
- `AIVML_API_KEY`
- `AIVML_MODEL`
- `AIVML_BASE_URL`

### Backend (`backend/.env`)

Create local env:

```powershell
Copy-Item backend\.env.example backend\.env
```

Important keys:

- `CIRCLE_API_KEY` (required for Circle-backed flows)
- `ENTITY_SECRET` (optional; required only if SDK flow needs it)
- `CIRCLE_WALLET_ID` (usually required for pay flow)
- `CIRCLE_WALLET_SET_ID` (optional)
- `OMNICLAW_NETWORK` (default: `ARC_TESTNET`)
- `ARC_RPC_URL`
- `ARC_EXPLORER_URL`
- `OMNICLAW_PRIVATE_KEY` (optional; needed for some signing flows)
- `SELLER_BASE_URL` (optional local seller shortcut)
- `OMNICLAW_FORCE_ONCHAIN_PROOF` (`true/false`, optional)
- `OMNICLAW_PROOF_RECIPIENT` (required if proof mode is `true`)

## Run Locally

### 1) Install frontend dependencies

```powershell
pnpm install
```

### 2) Install backend dependencies

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
```

### 3) Start backend

```powershell
uvicorn backend.main:app --port 8090 --reload
```

### 4) Start frontend (new terminal)

```powershell
pnpm dev
```

Open the app at:

- `http://localhost:3000` (or next available port shown in terminal)

## Frontend Scripts

- `pnpm dev` -> run Next.js dev server
- `pnpm build` -> production build
- `pnpm start` -> run production server
- `pnpm lint` -> run ESLint
- `pnpm typecheck` -> run TypeScript checks
- `pnpm format` -> run Prettier on TS/TSX files

## Backend Routes (adapter)

From `backend/main.py`:

- `GET /health`
- `GET /config/status`
- `GET /balance`
- `GET /transactions`
- `GET /resolve-tx`
- `POST /inspect`
- `POST /pay`
- `POST /guards/budget`
- `POST /guards/recipient`
- `POST /seller/start-demo`
- `GET /seller/ping`
- `GET /seller/data`
- `GET /api/search`
- `GET /api/social-profile`
- `GET /api/code-docs`
- `GET /api/market-data`
- `GET /api/weather`
- `GET /api/products`
- `GET /api/assistant`
- `POST /deposit`
- `POST /withdraw`

## Notes

- `PROJECT_HANDOFF.md` contains the implementation mapping and wiring status.
- Keep `.env` and `backend/.env` local only.
