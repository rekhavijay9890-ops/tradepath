"""
Strategy Engine — Layer 2: Technical analysis and signal generation.

Computes EMA(20), EMA(50), RSI(14) and derives Buy / Hold / Exit labels
based on the crossover + RSI rules defined for this application.
"""

from __future__ import annotations

import pandas as pd
import pandas_ta as ta


EMA_FAST = 20
EMA_SLOW = 50
RSI_PERIOD = 14
RSI_BUY_THRESHOLD = 50
RSI_EXIT_THRESHOLD = 40


def add_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """Append EMA(20), EMA(50), and RSI(14) columns to an OHLCV DataFrame."""
    if df.empty or "Close" not in df.columns:
        return df.copy()

    out = df.copy()
    out[f"EMA_{EMA_FAST}"] = ta.ema(out["Close"], length=EMA_FAST)
    out[f"EMA_{EMA_SLOW}"] = ta.ema(out["Close"], length=EMA_SLOW)
    out[f"RSI_{RSI_PERIOD}"] = ta.rsi(out["Close"], length=RSI_PERIOD)
    return out


def _raw_signal(row: pd.Series) -> str:
    ema_fast = row.get(f"EMA_{EMA_FAST}")
    ema_slow = row.get(f"EMA_{EMA_SLOW}")
    rsi = row.get(f"RSI_{RSI_PERIOD}")

    if pd.isna(ema_fast) or pd.isna(ema_slow) or pd.isna(rsi):
        return "neutral"

    if ema_fast > ema_slow and rsi > RSI_BUY_THRESHOLD:
        return "buy"
    if ema_fast < ema_slow or rsi < RSI_EXIT_THRESHOLD:
        return "exit"
    return "neutral"


def add_signals(df: pd.DataFrame) -> pd.DataFrame:
    """Add raw_signal and human-readable signal columns."""
    if df.empty:
        return df.copy()

    out = add_indicators(df)
    out["raw_signal"] = out.apply(_raw_signal, axis=1)

    labels: list[str] = []
    for i, raw in enumerate(out["raw_signal"]):
        if raw == "exit":
            labels.append("Exit")
        elif raw == "buy":
            prev_raw = out["raw_signal"].iloc[i - 1] if i > 0 else "neutral"
            labels.append("Fresh Buy" if prev_raw != "buy" else "Hold")
        else:
            labels.append("Neutral")

    out["signal"] = labels
    return out


def latest_screener_row(ticker: str, df: pd.DataFrame) -> dict:
    """Build a single summary row for the market screener table."""
    if df.empty:
        return {
            "Ticker": ticker,
            "Close": None,
            f"EMA_{EMA_FAST}": None,
            f"EMA_{EMA_SLOW}": None,
            f"RSI_{RSI_PERIOD}": None,
            "Signal": "No Data",
        }

    enriched = add_signals(df)
    last = enriched.iloc[-1]
    return {
        "Ticker": ticker,
        "Close": round(float(last["Close"]), 2),
        f"EMA_{EMA_FAST}": round(float(last[f"EMA_{EMA_FAST}"]), 2)
        if pd.notna(last[f"EMA_{EMA_FAST}"])
        else None,
        f"EMA_{EMA_SLOW}": round(float(last[f"EMA_{EMA_SLOW}"]), 2)
        if pd.notna(last[f"EMA_{EMA_SLOW}"])
        else None,
        f"RSI_{RSI_PERIOD}": round(float(last[f"RSI_{RSI_PERIOD}"]), 2)
        if pd.notna(last[f"RSI_{RSI_PERIOD}"])
        else None,
        "Signal": last["signal"],
    }


def build_screener_table(ticker_data: dict[str, pd.DataFrame]) -> pd.DataFrame:
    """Aggregate latest signals across all tickers into one DataFrame."""
    rows = [latest_screener_row(ticker, df) for ticker, df in ticker_data.items()]
    table = pd.DataFrame(rows)
    if not table.empty:
        table = table.sort_values("Ticker").reset_index(drop=True)
    return table
