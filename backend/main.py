from __future__ import annotations

import os
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, Query
from pydantic import BaseModel, Field

try:
    # Works when running from repo root (module path includes `backend.`)
    from backend.omniclaw_adapter import OfficialOmniClawAdapter
    from backend.seller_demo import (
        api_code_docs,
        api_general_assistant,
        api_products,
        api_market_data,
        api_search,
        api_social_profile,
        api_weather,
        seller_data,
        seller_ping,
        start_seller_demo,
    )
except ModuleNotFoundError:
    # Works on Railway when root directory is `backend`
    from omniclaw_adapter import OfficialOmniClawAdapter
    from seller_demo import (
        api_code_docs,
        api_general_assistant,
        api_products,
        api_market_data,
        api_search,
        api_social_profile,
        api_weather,
        seller_data,
        seller_ping,
        start_seller_demo,
    )

load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"), override=True)

app = FastAPI(title="OmniClaw Backend Adapter", version="0.1.0")
adapter = OfficialOmniClawAdapter()


class InspectRequest(BaseModel):
    endpoint: str = Field(..., min_length=1)


class PayRequest(BaseModel):
    endpoint: str = Field(..., min_length=1)
    amount: str | None = None
    purpose: str | None = None


class BudgetGuardRequest(BaseModel):
    wallet_id: str | None = None
    daily_limit: str = Field(..., min_length=1)


class RecipientGuardRequest(BaseModel):
    wallet_id: str | None = None
    domains: list[str] | None = None
    addresses: list[str] | None = None


class AmountRequest(BaseModel):
    amount: str = Field(..., min_length=1)


class SellerStartRequest(BaseModel):
    price: str = "0.01"
    endpoint: str = "/ping"
    port: int = 8000


@app.get("/health")
def health() -> dict[str, Any]:
    return adapter.health()


@app.get("/config/status")
def config_status() -> dict[str, Any]:
    return adapter.config_status()


@app.get("/balance")
def balance() -> dict[str, Any]:
    return adapter.get_balance()


@app.get("/transactions")
def transactions() -> dict[str, Any]:
    return adapter.get_transactions()


@app.get("/resolve-tx")
def resolve_tx(transaction_id: str = Query(default="", description="Circle transaction ID to resolve")) -> dict[str, Any]:
    return adapter.resolve_tx_hash(transaction_id)


@app.post("/inspect")
def inspect_endpoint(payload: InspectRequest) -> dict[str, Any]:
    return adapter.inspect_endpoint(payload.endpoint)


@app.post("/pay")
def pay(payload: PayRequest) -> dict[str, Any]:
    return adapter.pay_endpoint(payload.endpoint, amount=payload.amount, purpose=payload.purpose)


@app.post("/guards/budget")
def add_budget_guard(payload: BudgetGuardRequest) -> dict[str, Any]:
    return adapter.add_budget_guard(wallet_id=payload.wallet_id or "", daily_limit=payload.daily_limit)


@app.post("/guards/recipient")
def add_recipient_guard(payload: RecipientGuardRequest) -> dict[str, Any]:
    return adapter.add_recipient_guard(
        wallet_id=payload.wallet_id or "",
        domains=payload.domains,
        addresses=payload.addresses,
    )


@app.post("/seller/start-demo")
def seller_start_demo(payload: SellerStartRequest) -> dict[str, Any]:
    return {
        "ok": True,
        "unavailable": False,
        "blocked": False,
        "error": None,
        "data": start_seller_demo(price=payload.price, endpoint=payload.endpoint, port=payload.port),
    }


@app.get("/seller/ping")
def seller_ping_endpoint() -> dict[str, Any]:
    return {
        "ok": True,
        "unavailable": False,
        "blocked": False,
        "error": None,
        "data": seller_ping(),
    }


@app.get("/seller/data")
def seller_data_endpoint() -> dict[str, Any]:
    return {
        "ok": True,
        "unavailable": False,
        "blocked": False,
        "error": None,
        "data": seller_data(),
    }


@app.get("/api/search")
def api_search_endpoint(q: str = Query(default="", description="Search query")) -> dict[str, Any]:
    return api_search(q)


@app.get("/api/social-profile")
def api_social_profile_endpoint(name: str = Query(default="", description="Entity/person name")) -> dict[str, Any]:
    return api_social_profile(name)


@app.get("/api/code-docs")
def api_code_docs_endpoint(q: str = Query(default="", description="Code/docs query")) -> dict[str, Any]:
    return api_code_docs(q)


@app.get("/api/market-data")
def api_market_data_endpoint(q: str = Query(default="", description="Market query")) -> dict[str, Any]:
    return api_market_data(q)


@app.get("/api/weather")
def api_weather_endpoint(location: str = Query(default="", description="Location")) -> dict[str, Any]:
    return api_weather(location)


@app.get("/api/products")
def api_products_endpoint(
    q: str = Query(default="", description="Product discovery query"),
    query: str = Query(default="", description="Alias for product query"),
) -> dict[str, Any]:
    return api_products(q or query)


@app.get("/api/assistant")
def api_assistant_endpoint(
    q: str = Query(default="", description="General assistant query"),
    query: str = Query(default="", description="Alias for assistant query"),
) -> dict[str, Any]:
    return api_general_assistant(q or query)


@app.post("/deposit")
def deposit(payload: AmountRequest) -> dict[str, Any]:
    return adapter.deposit(payload.amount)


@app.post("/withdraw")
def withdraw(payload: AmountRequest) -> dict[str, Any]:
    return adapter.withdraw(payload.amount)
