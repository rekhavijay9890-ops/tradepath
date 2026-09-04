"""Market data with yfinance fallback when 5paisa is not connected."""

from __future__ import annotations

from typing import Any

import yfinance as yf

from broker import NSE_SCRIPS


def fetch_yahoo_quotes(symbols: list[str]) -> list[dict[str, Any]]:
    results = []
    for sym in symbols:
        if sym not in NSE_SCRIPS:
            continue
        try:
            t = yf.Ticker(f"{sym}.NS")
            info = t.fast_info
            hist = t.history(period="1d")
            if hist.empty:
                continue
            last = hist.iloc[-1]
            prev = float(info.get("previous_close", last["Open"]))
            price = float(last["Close"])
            change_pct = ((price - prev) / prev * 100) if prev else 0
            results.append({
                "symbol": sym,
                "name": NSE_SCRIPS[sym]["name"],
                "price": round(price, 2),
                "open": round(float(last["Open"]), 2),
                "high": round(float(last["High"]), 2),
                "low": round(float(last["Low"]), 2),
                "change_pct": round(change_pct, 2),
                "volume": int(last["Volume"]),
                "source": "yahoo",
            })
        except Exception:
            continue
    return results


def score_stock(q: dict[str, Any]) -> int:
    """Simple intraday score 0–100."""
    score = 50
    vol = q.get("volume", 0)
    chg = abs(q.get("change_pct", 0))
    if vol > 2_000_000:
        score += 20
    elif vol > 1_000_000:
        score += 10
    if 1 <= chg <= 4:
        score += 20
    elif 0.5 <= chg <= 5:
        score += 10
    if q.get("change_pct", 0) > 0:
        score += 10
    return min(100, score)
