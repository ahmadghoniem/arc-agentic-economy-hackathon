from __future__ import annotations

import hashlib
import os
import subprocess
from typing import Any

_seller_process: subprocess.Popen[str] | None = None


def _build_windows_command(price: str, endpoint: str, port: int) -> str:
    return (
        "omniclaw-cli serve "
        f"--price {price} "
        f"--endpoint {endpoint} "
        "--exec \"python -c \"\"import json; print(json.dumps({'pong': True}))\"\"\" "
        f"--port {port}"
    )


def start_seller_demo(price: str = "0.01", endpoint: str = "/ping", port: int = 8000) -> dict[str, Any]:
    global _seller_process

    command = [
        "omniclaw-cli",
        "serve",
        "--price",
        str(price),
        "--endpoint",
        endpoint,
        "--exec",
        "python -c \"import json; print(json.dumps({'pong': True}))\"",
        "--port",
        str(port),
    ]

    if _seller_process and _seller_process.poll() is None:
        return {
            "ok": True,
            "mode": "official_cli",
            "running": True,
            "pid": _seller_process.pid,
            "endpoint": endpoint,
            "port": port,
        }

    try:
        _seller_process = subprocess.Popen(  # noqa: S602
            " ".join(command),
            shell=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            cwd=os.getcwd(),
            text=True,
        )
        return {
            "ok": True,
            "mode": "official_cli",
            "running": True,
            "pid": _seller_process.pid,
            "endpoint": endpoint,
            "port": port,
            "windows_command": _build_windows_command(price, endpoint, port),
        }
    except Exception as exc:
        return {
            "ok": False,
            "mode": "simulated",
            "running": False,
            "error": str(exc),
            "label": "Seller response simulated; payment path uses official OmniClaw SDK.",
            "windows_command": _build_windows_command(price, endpoint, port),
        }


def seller_ping() -> dict[str, Any]:
    return {
        "pong": True,
        "localPaidApiDemo": True,
        "label": "Local paid API demo endpoint.",
    }


def seller_data() -> dict[str, Any]:
    return {
        "localPaidApiDemo": True,
        "label": "Local paid API demo endpoint.",
        "market_data": {
            "symbol": "USDC",
            "network": "ARC-TESTNET",
            "price_usd": 1,
        },
    }


def api_search(query: str) -> dict[str, Any]:
    entity = "Linus Torvalds" if "linux" in query.lower() else "Unknown"
    answer = (
        "Linux was created by Linus Torvalds."
        if entity == "Linus Torvalds"
        else "No definitive creator found in local demo index."
    )
    return {
        "localPaidApiDemo": True,
        "query": query,
        "answer": answer,
        "entity": entity,
    }


def api_social_profile(name: str) -> dict[str, Any]:
    name_normalized = name.strip() or "Unknown"
    followers = 213840 if "linus" in name_normalized.lower() else 50120
    return {
        "localPaidApiDemo": True,
        "name": name_normalized,
        "platform": "X/Twitter",
        "followers": followers,
    }


def api_code_docs(query: str) -> dict[str, Any]:
    return {
        "localPaidApiDemo": True,
        "query": query,
        "result": "x402 is a paid HTTP pattern using 402 challenge + signed payment headers.",
        "source": "local-doc-index",
    }


def api_market_data(query: str) -> dict[str, Any]:
    symbol = (query.strip() or "USDC").upper()
    price = 1.0 if symbol == "USDC" else 172.42
    return {
        "localPaidApiDemo": True,
        "query": query,
        "symbol": symbol,
        "priceUsd": price,
        "change24hPct": 0.1,
    }


def api_weather(location: str) -> dict[str, Any]:
    loc = location.strip() or "Unknown"
    temp = 33 if "delhi" in loc.lower() else 26
    return {
        "localPaidApiDemo": True,
        "location": loc,
        "temperatureC": temp,
        "condition": "Hazy",
    }


# ---------------------------------------------------------------------------
# Product catalog: covers many categories with demo-friendly prices ($3-$8)
# ---------------------------------------------------------------------------
_PRODUCT_CATALOG: dict[str, list[dict[str, Any]]] = {
    "jacket": [
        {"name": "Arc Alpine Shell", "brand": "SummitWear", "category": "Outdoor Jacket", "priceUsd": 5.99, "rating": 4.8, "buyUrl": "https://demo.store/products/arc-alpine-shell"},
        {"name": "Nord Urban Parka", "brand": "Northline", "category": "Winter Parka", "priceUsd": 7.49, "rating": 4.7, "buyUrl": "https://demo.store/products/nord-urban-parka"},
        {"name": "Monsoon Lite Windbreaker", "brand": "AeroFit", "category": "Lightweight Jacket", "priceUsd": 4.99, "rating": 4.6, "buyUrl": "https://demo.store/products/monsoon-lite-windbreaker"},
    ],
    "phone": [
        {"name": "Arc Pixel Ultra", "brand": "ArcTech", "category": "Smartphone", "priceUsd": 7.99, "rating": 4.9, "buyUrl": "https://demo.store/products/arc-pixel-ultra"},
        {"name": "Nova Slim 5G", "brand": "NovaMobile", "category": "Smartphone", "priceUsd": 5.49, "rating": 4.6, "buyUrl": "https://demo.store/products/nova-slim-5g"},
        {"name": "Zenith Fold Pro", "brand": "ZenTech", "category": "Foldable Phone", "priceUsd": 8.99, "rating": 4.7, "buyUrl": "https://demo.store/products/zenith-fold-pro"},
    ],
    "laptop": [
        {"name": "ArcBook Pro 16", "brand": "ArcTech", "category": "Laptop", "priceUsd": 8.99, "rating": 4.8, "buyUrl": "https://demo.store/products/arcbook-pro-16"},
        {"name": "Nova Air 14", "brand": "NovaTech", "category": "Ultrabook", "priceUsd": 6.49, "rating": 4.7, "buyUrl": "https://demo.store/products/nova-air-14"},
        {"name": "ZenPad Creator", "brand": "ZenTech", "category": "Creative Laptop", "priceUsd": 7.99, "rating": 4.5, "buyUrl": "https://demo.store/products/zenpad-creator"},
    ],
    "headphone": [
        {"name": "ArcPods Max", "brand": "ArcAudio", "category": "Over-Ear Headphones", "priceUsd": 4.99, "rating": 4.8, "buyUrl": "https://demo.store/products/arcpods-max"},
        {"name": "Bass Nova X", "brand": "NovaSound", "category": "Wireless Earbuds", "priceUsd": 3.49, "rating": 4.6, "buyUrl": "https://demo.store/products/bass-nova-x"},
        {"name": "Studio Zen ANC", "brand": "ZenAudio", "category": "Noise Cancelling", "priceUsd": 5.99, "rating": 4.7, "buyUrl": "https://demo.store/products/studio-zen-anc"},
    ],
    "shoe": [
        {"name": "Arc Runner Pro", "brand": "ArcSport", "category": "Running Shoes", "priceUsd": 5.99, "rating": 4.7, "buyUrl": "https://demo.store/products/arc-runner-pro"},
        {"name": "Nova Street V2", "brand": "NovaSport", "category": "Casual Sneakers", "priceUsd": 4.49, "rating": 4.5, "buyUrl": "https://demo.store/products/nova-street-v2"},
        {"name": "Zen Hiker Trail", "brand": "ZenOutdoor", "category": "Hiking Boots", "priceUsd": 6.99, "rating": 4.8, "buyUrl": "https://demo.store/products/zen-hiker-trail"},
    ],
    "watch": [
        {"name": "ArcWatch Ultra", "brand": "ArcTech", "category": "Smartwatch", "priceUsd": 6.99, "rating": 4.8, "buyUrl": "https://demo.store/products/arcwatch-ultra"},
        {"name": "Nova Chrono", "brand": "NovaTime", "category": "Classic Watch", "priceUsd": 4.99, "rating": 4.6, "buyUrl": "https://demo.store/products/nova-chrono"},
        {"name": "ZenFit Band", "brand": "ZenHealth", "category": "Fitness Tracker", "priceUsd": 3.49, "rating": 4.5, "buyUrl": "https://demo.store/products/zenfit-band"},
    ],
    "apple": [
        {"name": "Fuji Premium Organic Apples (1kg)", "brand": "FreshFarm", "category": "Fresh Fruit", "priceUsd": 3.49, "rating": 4.9, "buyUrl": "https://demo.store/products/fuji-organic-apples"},
        {"name": "Granny Smith Green Apples (6-pack)", "brand": "GreenGrocer", "category": "Fresh Fruit", "priceUsd": 2.99, "rating": 4.7, "buyUrl": "https://demo.store/products/granny-smith-apples"},
        {"name": "Honeycrisp Apple Gift Box", "brand": "OrchardDirect", "category": "Premium Fruit", "priceUsd": 5.99, "rating": 4.8, "buyUrl": "https://demo.store/products/honeycrisp-gift-box"},
    ],
    "book": [
        {"name": "The Art of AI", "brand": "TechPress", "category": "Technology Book", "priceUsd": 4.99, "rating": 4.8, "buyUrl": "https://demo.store/products/art-of-ai"},
        {"name": "Blockchain for Beginners", "brand": "CryptoBooks", "category": "Finance Book", "priceUsd": 3.99, "rating": 4.5, "buyUrl": "https://demo.store/products/blockchain-beginners"},
        {"name": "Code and Coffee", "brand": "DevReads", "category": "Programming Book", "priceUsd": 5.49, "rating": 4.7, "buyUrl": "https://demo.store/products/code-and-coffee"},
    ],
    "subscription": [
        {"name": "CloudAI Pro Plan (Monthly)", "brand": "CloudAI", "category": "AI Subscription", "priceUsd": 4.99, "rating": 4.8, "buyUrl": "https://demo.store/products/cloudai-pro"},
        {"name": "DevTools Premium (Monthly)", "brand": "DevSuite", "category": "Developer Tools", "priceUsd": 3.99, "rating": 4.6, "buyUrl": "https://demo.store/products/devtools-premium"},
        {"name": "StreamMax Ultra (Monthly)", "brand": "StreamMax", "category": "Streaming", "priceUsd": 5.99, "rating": 4.7, "buyUrl": "https://demo.store/products/streammax-ultra"},
    ],
    "game": [
        {"name": "Pixel Quest Remastered", "brand": "ArcGames", "category": "Adventure Game", "priceUsd": 4.99, "rating": 4.7, "buyUrl": "https://demo.store/products/pixel-quest"},
        {"name": "Neon Racer 2026", "brand": "SpeedStudio", "category": "Racing Game", "priceUsd": 5.99, "rating": 4.5, "buyUrl": "https://demo.store/products/neon-racer-2026"},
        {"name": "Dungeon Forge", "brand": "IndieCraft", "category": "RPG Game", "priceUsd": 3.49, "rating": 4.8, "buyUrl": "https://demo.store/products/dungeon-forge"},
    ],
    "coffee": [
        {"name": "Ethiopian Yirgacheffe (250g)", "brand": "BeanCraft", "category": "Specialty Coffee", "priceUsd": 4.49, "rating": 4.9, "buyUrl": "https://demo.store/products/ethiopian-yirgacheffe"},
        {"name": "Colombian Dark Roast (500g)", "brand": "BrewMaster", "category": "Ground Coffee", "priceUsd": 5.99, "rating": 4.6, "buyUrl": "https://demo.store/products/colombian-dark-roast"},
        {"name": "Matcha Latte Kit", "brand": "ZenTea", "category": "Tea & Coffee", "priceUsd": 6.99, "rating": 4.7, "buyUrl": "https://demo.store/products/matcha-latte-kit"},
    ],
}

# Aliases to map common keywords to catalog categories
_KEYWORD_MAP: dict[str, str] = {
    "jacket": "jacket", "coat": "jacket", "parka": "jacket", "windbreaker": "jacket",
    "phone": "phone", "mobile": "phone", "smartphone": "phone", "iphone": "phone", "android": "phone",
    "laptop": "laptop", "computer": "laptop", "macbook": "laptop", "notebook": "laptop", "pc": "laptop",
    "headphone": "headphone", "earbuds": "headphone", "earphone": "headphone", "airpods": "headphone", "speaker": "headphone",
    "shoe": "shoe", "sneaker": "shoe", "boot": "shoe", "sandal": "shoe", "footwear": "shoe",
    "watch": "watch", "smartwatch": "watch", "fitbit": "watch", "wristwatch": "watch",
    "apple": "apple", "fruit": "apple", "mango": "apple", "banana": "apple", "orange": "apple",
    "book": "book", "novel": "book", "textbook": "book", "ebook": "book",
    "subscription": "subscription", "chatgpt": "subscription", "netflix": "subscription", "spotify": "subscription", "premium": "subscription", "plan": "subscription",
    "game": "game", "gaming": "game", "ps5": "game", "xbox": "game", "nintendo": "game", "video game": "game",
    "coffee": "coffee", "tea": "coffee", "espresso": "coffee", "brew": "coffee",
}


def _find_category(text: str) -> str | None:
    """Find the best matching product category for a query."""
    for keyword, category in _KEYWORD_MAP.items():
        if keyword in text:
            return category
    return None


def _generate_generic_results(query: str) -> list[dict[str, Any]]:
    """Generate plausible demo product results for any unrecognized query."""
    # Deterministic but varied pricing based on query hash
    h = int(hashlib.md5(query.encode()).hexdigest()[:8], 16)  # noqa: S324
    base_price = 3.49 + (h % 5)
    words = query.split()
    title_word = words[0].capitalize() if words else "Item"
    return [
        {"name": f"{title_word} Pro Edition", "brand": "ArcStore", "category": "General", "priceUsd": round(base_price + 1.5, 2), "rating": 4.7, "buyUrl": f"https://demo.store/products/{title_word.lower()}-pro"},
        {"name": f"{title_word} Standard Pack", "brand": "NovaMarket", "category": "General", "priceUsd": round(base_price, 2), "rating": 4.5, "buyUrl": f"https://demo.store/products/{title_word.lower()}-standard"},
        {"name": f"{title_word} Value Bundle", "brand": "ZenShop", "category": "General", "priceUsd": round(base_price - 0.5, 2), "rating": 4.3, "buyUrl": f"https://demo.store/products/{title_word.lower()}-value"},
    ]


def api_products(query: str) -> dict[str, Any]:
    q = (query or "").strip()
    text = q.lower()

    # Try to match a known category
    category = _find_category(text)
    if category and category in _PRODUCT_CATALOG:
        results = _PRODUCT_CATALOG[category]
    else:
        results = _generate_generic_results(q)

    return {
        "localPaidApiDemo": True,
        "query": q,
        "results": results,
        "count": len(results),
    }


# ---------------------------------------------------------------------------
# General assistant: catch-all endpoint for arbitrary queries
# ---------------------------------------------------------------------------
def api_general_assistant(query: str) -> dict[str, Any]:
    """Generates a helpful demo response for any user query."""
    q = (query or "").strip()
    text = q.lower()

    # Try to provide contextual answers for common intents
    if any(kw in text for kw in ["buy", "purchase", "order", "shop", "get me"]):
        # Shopping intent -> redirect to product results
        return api_products(q)

    if any(kw in text for kw in ["weather", "temperature", "forecast", "rain"]):
        location = q.replace("weather", "").replace("in", "").replace("for", "").strip() or "New York"
        return api_weather(location)

    if any(kw in text for kw in ["price", "market", "crypto", "bitcoin", "token", "stock"]):
        return api_market_data(q)

    if any(kw in text for kw in ["who", "what is", "when", "where", "how", "why"]):
        return {
            "localPaidApiDemo": True,
            "query": q,
            "answer": f"I processed your question: {q}. Here is the best response from the local paid API demo dataset.",
            "source": "omniclaw-assistant",
            "confidence": 0.85,
        }

    # Default: provide a helpful generic response
    return {
        "localPaidApiDemo": True,
        "query": q,
        "answer": f"I processed your request: \"{q}\" using the local paid API demo endpoint.",
        "source": "omniclaw-assistant",
        "type": "general_response",
    }
