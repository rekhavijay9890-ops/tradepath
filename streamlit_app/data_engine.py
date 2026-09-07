"""
Data Engine — Layer 1: Historical OHLCV data acquisition via yfinance.
"""

from __future__ import annotations

import pandas as pd
import yfinance as yf

# Screener universe (15 Nifty 50 stocks)
NIFTY_SYMBOLS: list[str] = [
    "RELIANCE.NS",
    "TCS.NS",
    "INFY.NS",
    "HDFCBANK.NS",
    "ICICIBANK.NS",
    "BHARTIARTL.NS",
    "SBIN.NS",
    "ITC.NS",
    "LT.NS",
    "BAJFINANCE.NS",
    "KOTAKBANK.NS",
    "AXISBANK.NS",
    "MARUTI.NS",
    "SUNPHARMA.NS",
    "TITAN.NS",
]

# Full list for backtester dropdown
NIFTY_50_SYMBOLS: list[str] = NIFTY_SYMBOLS + [
    "HINDUNILVR.NS",
    "ASIANPAINT.NS",
    "ULTRACEMCO.NS",
    "NESTLEIND.NS",
    "WIPRO.NS",
    "HCLTECH.NS",
    "POWERGRID.NS",
    "NTPC.NS",
    "ONGC.NS",
    "TATASTEEL.NS",
    "JSWSTEEL.NS",
    "ADANIENT.NS",
    "ADANIPORTS.NS",
    "COALINDIA.NS",
    "TECHM.NS",
    "INDUSINDBK.NS",
    "BAJAJFINSV.NS",
    "GRASIM.NS",
    "CIPLA.NS",
    "DRREDDY.NS",
    "EICHERMOT.NS",
    "HEROMOTOCO.NS",
    "APOLLOHOSP.NS",
    "DIVISLAB.NS",
    "BRITANNIA.NS",
    "HINDALCO.NS",
    "TATAMOTORS.NS",
    "BPCL.NS",
    "SBILIFE.NS",
    "HDFCLIFE.NS",
    "TATACONSUM.NS",
    "M&M.NS",
    "LTIM.NS",
    "BEL.NS",
    "SHRIRAMFIN.NS",
]

_PERIOD_MAP: dict[str, str] = {
    "6m": "6mo",
    "1y": "1y",
    "2y": "2y",
    "5y": "5y",
}


def _normalize_index(df: pd.DataFrame) -> pd.DataFrame:
    """Ensure tz-naive DatetimeIndex — required for Streamlit / Plotly."""
    if df.empty:
        return df

    out = df.copy()
    if not isinstance(out.index, pd.DatetimeIndex):
        out.index = pd.to_datetime(out.index)

    if out.index.tz is not None:
        out.index = out.index.tz_convert("UTC").tz_localize(None)

    return out.sort_index().loc[~out.index.duplicated(keep="last")]


def fetch_historical_data(symbol: str, period: str = "6m") -> pd.DataFrame:
    """
    Fetch daily OHLCV history for a single symbol.

    Parameters
    ----------
    symbol : str
        Yahoo Finance ticker (e.g. 'RELIANCE.NS').
    period : str
        Lookback window ('6m', '1y', '2y', …).

    Returns
    -------
    pd.DataFrame
        Columns: Open, High, Low, Close, Volume.  Tz-naive DatetimeIndex.
    """
    yf_period = _PERIOD_MAP.get(period, period)

    raw = yf.download(
        symbol,
        period=yf_period,
        interval="1d",
        auto_adjust=True,
        progress=False,
        threads=False,
    )

    if raw.empty:
        return pd.DataFrame(columns=["Open", "High", "Low", "Close", "Volume"])

    if isinstance(raw.columns, pd.MultiIndex):
        raw.columns = raw.columns.get_level_values(0)

    keep = [c for c in ["Open", "High", "Low", "Close", "Volume"] if c in raw.columns]
    return _normalize_index(raw[keep].copy())
