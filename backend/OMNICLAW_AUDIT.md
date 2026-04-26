# OmniClaw Package Audit

Date: 2026-04-25
Workspace: `E:\hackathon`
Python venv used: `E:\hackathon\.venv`

## Commands and outputs

### `python --version`

```txt
Python 3.11.1
```

### `pip show omniclaw`

`pip` is not on PATH in this shell; used `python -m pip show omniclaw` from venv:

```txt
Name: omniclaw
Version: 0.0.7
Summary: Economic Execution and Control Layer for Agentic Systems
Home-page: https://omniclaw.ai
Location: E:\hackathon\.venv\Lib\site-packages
```

### `python -c "import omniclaw; print(omniclaw)"`

```txt
<module 'omniclaw' from 'E:\\hackathon\\.venv\\Lib\\site-packages\\omniclaw\\__init__.py'>
```

### `python -c "from omniclaw import OmniClaw; import inspect; print(inspect.signature(OmniClaw))"`

```txt
(circle_api_key: 'str | None' = None, entity_secret: 'str | None' = None, network: 'Network | None' = None, log_level: 'int | str | None' = None, trust_policy: 'TrustPolicy | str | None' = None, rpc_url: 'str | None' = None) -> 'None'
```

### `python -c "from omniclaw import OmniClaw; import inspect; print([m for m in dir(OmniClaw) if not m.startswith('_')])"`

```txt
['add_budget_guard', 'add_budget_guard_for_set', 'add_confirm_guard', 'add_confirm_guard_for_set', 'add_rate_limit_guard', 'add_rate_limit_guard_for_set', 'add_recipient_guard', 'add_recipient_guard_for_set', 'add_single_tx_guard', 'apply_default_guards', 'approve_payment_intent_review', 'batch_pay', 'can_pay', 'cancel_payment_intent', 'config', 'configure_nanopayments', 'confirm_payment_intent', 'create_agent', 'create_agent_wallet', 'create_payment_intent', 'create_wallet', 'create_wallet_set', 'current_payment', 'deposit_to_gateway', 'detect_method', 'finalize_pending_settlement', 'gateway', 'get_balance', 'get_detailed_balance', 'get_gateway_balance', 'get_gateway_balance_for_address', 'get_gateway_onchain_balance', 'get_payment_address', 'get_payment_intent', 'get_wallet', 'get_wallet_set', 'guards', 'intent', 'intents', 'ledger', 'list_guards', 'list_guards_for_set', 'list_pending_settlements', 'list_transactions', 'list_wallet_sets', 'list_wallets', 'nanopayment_adapter', 'pay', 'reconcile_pending_settlements', 'sell', 'simulate', 'sync_transaction', 'trust', 'wallet', 'webhooks', 'withdraw_from_gateway']
```

### `omniclaw --help`

```txt
usage: omniclaw [-h] {doctor,env,setup,server,facilitator,policy} ...
```

### `omniclaw-cli --help`

```txt
Commands include: configure, balance, balance-detail, deposit, withdraw, pay, simulate,
inspect-x402, can-pay, ledger/list-tx, serve, status, ping
```

### `omniclaw-mcp --help`

```txt
omniclaw-mcp not installed
```

## Method signatures verified

```txt
create_agent_wallet(self, agent_name, blockchain=None, apply_default_guards=True)
add_budget_guard(self, wallet_id, daily_limit=None, hourly_limit=None, total_limit=None, name='budget')
add_recipient_guard(self, wallet_id, mode='whitelist', addresses=None, patterns=None, domains=None, name='recipient')
pay(self, wallet_id, recipient, amount, ...)
sell(self, price, seller_address=None, facilitator=None)
get_balance(self, wallet_id)
list_transactions(self, wallet_id=None, blockchain=None)
deposit_to_gateway(self, wallet_id, amount_usdc, network=None, ...)
withdraw_from_gateway(self, wallet_id, amount_usdc, destination_chain=None, ...)
can_pay(self, recipient)
detect_method(self, recipient)
```

## Credential observations (from runtime behavior)

1. Instantiating `OmniClaw()` without credentials raises:
   - `ValueError: Required environment variable CIRCLE_API_KEY is not set`
2. `omniclaw doctor` also reports missing:
   - `CIRCLE_API_KEY`
   - `ENTITY_SECRET` (or managed entity secret)
3. `omniclaw env` marks:
   - Required: `CIRCLE_API_KEY`, `OMNICLAW_PRIVATE_KEY`
   - Optional: `ENTITY_SECRET`, `OMNICLAW_RPC_URL`, `OMNICLAW_NETWORK`, etc.

Note: `OMNICLAW_PRIVATE_KEY` appears required in CLI env output, but backend adapter only requires it if the selected payment route actually needs signing in practice.

## Important compatibility note

On this Windows run, `omniclaw` import initially failed due to `web3` requiring `pkg_resources`.
Pinning `setuptools<81` restored compatibility in the venv.

## Conclusion for integration

- Official package is installed and importable (`omniclaw==0.0.7`).
- Core methods needed for this demo exist: `pay`, `sell`, guards, `get_balance`, `list_transactions`, `deposit_to_gateway`, `withdraw_from_gateway`.
- `Network.ARC_TESTNET` exists in the installed package.
- CLI serve mode exists via `omniclaw-cli serve`.