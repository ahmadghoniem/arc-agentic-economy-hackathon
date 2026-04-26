# Hackathon Economics Proof

This document covers the two mandatory submission checks:

1. Show transaction frequency data (50+ onchain transactions in demo)
2. Explain why this model fails with traditional gas costs

## 1) 50+ onchain transactions proof

### Prerequisites

- Backend is running with live Circle credentials
- Onchain proof mode is enabled in `backend/.env`:

```env
OMNICLAW_FORCE_ONCHAIN_PROOF=true
OMNICLAW_PROOF_RECIPIENT=0xYourEvmAddress
```

### Generate 50+ proof transactions

Run from repo root:

```bash
python backend/scripts/generate_onchain_demo.py --count 55 --amount 0.0005
```

What this does:

- Calls backend `/pay` repeatedly
- Captures tx hashes (or resolves them from transaction IDs)
- Writes report to `backend/demo_tx_report.json`

### Verify in UI

Open the app and refresh balances/activity once.

`Gateway Activity` now includes a `Transaction Frequency` card showing:

- `Onchain tx observed`
- `Last hour` (`tx/h`)
- `Demo target: 50+ onchain transactions` progress bar

The count is derived from activity entries that include either:

- a real `arcscanUrl`, or
- a 66-char hex tx hash (`0x...`)

### Verify externally

Use links in the Payments list (`ArcScan`) and sample-check hashes from:

- `backend/demo_tx_report.json`

## 2) Margin explanation (why traditional gas fails)

### Core demo pricing

- Typical API call price: `~$0.00044`

### Cost comparison

- Circle Gateway offchain batching path: `~$0.00010`
- Solana L1 reference transfer: `~$0.00040`
- Base L2 reference transfer: `~$0.00200` (can spike higher)

### Unit margin math

At `$0.00044` revenue per call:

- Gateway path margin:
  - `0.00044 - 0.00010 = +0.00034` (positive)
- Solana L1 path margin:
  - `0.00044 - 0.00040 = +0.00004` (near-zero, fragile after infra/retries)
- Base L2 path margin:
  - `0.00044 - 0.00200 = -0.00156` (negative)

### Conclusion

Per-call micropayments at sub-cent pricing are not viable on a traditional per-transaction gas model at scale.
They become viable only when payment signatures are batched offchain and settled efficiently (Circle Gateway + OmniClaw guard flow), while still surfacing verifiable onchain proof.
