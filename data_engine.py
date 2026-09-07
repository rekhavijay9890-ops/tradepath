"""
Data Engine — Layer 1: Market data acquisition via yfinance.

Responsible for fetching OHLCV historical data and normalizing
datetime indices for downstream analytics and Streamlit charting.
"""

from __future__ import annotations

import pandas as pd
import yfinance as yf


NIFTY_50_TICKERS: list[str] = [
    "RELIANCE.NS",
    "TCS.NS",
    "INFY.NS",
    "HDFCBANK.NS",
    "ICICIBANK.NS",
    "BHARTIARTL.NS",
    "SBIN.NS",
    "HINDUNILVR.NS",
    "ITC.NS",
    "LT.NS",
    "BAJFINANCE.NS",
    "KOTAKBANK.NS",
    "AXISBANK.NS",
    "ASIANPAINT.NS",
    "MARUTI.NS",
    "SUNPHARMA.NS",
    "TITAN.NS",
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


def normalize_datetime_index(df: pd.DataFrame) -> pd.DataFrame:
    """
    Ensure the DataFrame index is a timezone-naive DatetimeIndex.

    Streamlit charts and pandas-ta work best with tz-naive indices.
    Converts timezone-aware indices to UTC then strips the timezone.
    """
    if df.empty:
        return df

    out = df.copy()
    if not isinstance(out.index, pd.DatetimeIndex):
        out.index = pd.to_datetime(out.index)

    if out.index.tz is not None:
        out.index = out.index.tz_convert("UTC").tz_localize(None)

    out = out.sort_index()
    out = out[~out.index.duplicated(keep="last")]
    return out


def fetch_ohlcv(
    ticker: str,
    period: str = "6mo",
    interval: str = "1d",
) -> pd.DataFrame:
    """Fetch OHLCV historical data for a single ticker."""
    raw = yf.download(
        ticker,
        period=period,
        interval=interval,
        auto_adjust=True,
        progress=False,
        threads=False,
    )

    if raw.empty:
        return pd.DataFrame(columns=["Open", "High", "Low", "Close", "Volume"])

    if isinstance(raw.columns, pd.MultiIndex):
        raw.columns = raw.columns.get_level_values(0)

    keep = [c for c in ["Open", "High", "Low", "Close", "Volume"] if c in raw.columns]
    return normalize_datetime_index(raw[keep].copy())


def fetch_multiple(
    tickers: list[str],
    period: str = "6mo",
    interval: str = "1d",
) -> dict[str, pd.DataFrame]:
    """Fetch OHLCV data for multiple tickers."""
    return {ticker: fetch_ohlcv(ticker, period=period, interval=interval) for ticker in tickers}
