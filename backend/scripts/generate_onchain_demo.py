from __future__ import annotations

import argparse
import json
import time
from pathlib import Path
from typing import Any

import httpx


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate 50+ onchain proof transactions for the OmniClaw demo."
    )
    parser.add_argument("--backend-url", default="http://localhost:8090")
    parser.add_argument("--count", type=int, default=55)
    parser.add_argument("--amount", default="0.0005")
    parser.add_argument("--endpoint", default="http://localhost:8090/api/assistant")
    parser.add_argument("--delay-ms", type=int, default=350)
    parser.add_argument("--resolve-retries", type=int, default=8)
    parser.add_argument(
        "--out",
        default="backend/demo_tx_report.json",
        help="Where to write tx report JSON",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    backend_url = args.backend_url.rstrip("/")
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    rows: list[dict[str, Any]] = []

    with httpx.Client(timeout=30.0) as client:
        for index in range(args.count):
            payload = {
                "endpoint": args.endpoint,
                "amount": args.amount,
                "purpose": f"Hackathon frequency demo call #{index + 1}",
            }
            response = client.post(f"{backend_url}/pay", json=payload)
            data = response.json()
            row: dict[str, Any] = {
                "index": index + 1,
                "ok": bool(data.get("ok")),
                "error": data.get("error"),
                "transaction_id": None,
                "tx_hash": None,
                "arcscan_url": None,
            }

            payment_data = data.get("data") if isinstance(data, dict) else {}
            if isinstance(payment_data, dict):
                row["transaction_id"] = payment_data.get("transaction_id")
                row["tx_hash"] = payment_data.get("tx_hash")
                row["arcscan_url"] = payment_data.get("arcscan_url")

            rows.append(row)
            print(
                f"[{index + 1}/{args.count}] ok={row['ok']} tx={row['tx_hash'] or row['transaction_id'] or '-'}"
            )
            time.sleep(max(0, args.delay_ms) / 1000)

        # Resolve hashes for rows that returned transaction_id first.
        for row in rows:
            if row.get("tx_hash") or not row.get("transaction_id"):
                continue
            tx_id = str(row["transaction_id"])
            resolved_hash = None
            for _ in range(args.resolve_retries):
                resolved = client.get(
                    f"{backend_url}/resolve-tx", params={"transaction_id": tx_id}
                ).json()
                resolved_data = resolved.get("data") if isinstance(resolved, dict) else {}
                if isinstance(resolved_data, dict) and resolved_data.get("tx_hash"):
                    resolved_hash = resolved_data.get("tx_hash")
                    row["tx_hash"] = resolved_hash
                    row["arcscan_url"] = resolved_data.get("arcscan_url")
                    break
                time.sleep(0.8)

    onchain_rows = [row for row in rows if row.get("tx_hash")]
    summary = {
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "requested_count": args.count,
        "successful_calls": sum(1 for row in rows if row.get("ok")),
        "onchain_hash_count": len(onchain_rows),
        "target_reached": len(onchain_rows) >= 50,
        "rows": rows,
    }

    out_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(f"\nSaved report to {out_path}")
    print(
        f"Onchain hashes: {summary['onchain_hash_count']} (target 50+) -> {'PASS' if summary['target_reached'] else 'NOT YET'}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
