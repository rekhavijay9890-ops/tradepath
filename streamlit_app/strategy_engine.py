"""
Strategy Engine — Layer 2: Indicators, signals, and dynamic ATR stop-loss.

Pure pandas/numpy indicators (no pandas-ta) for reliable Streamlit Cloud deploy.
"""

from __future__ import annotations

import pandas as pd

EMA_FAST = 20
EMA_SLOW = 50
RSI_PERIOD = 14
ATR_PERIOD = 14
ATR_MULTIPLIER = 1.5
VOLUME_SMA = 20

RSI_BUY_THRESHOLD = 50
RSI_SELL_THRESHOLD = 40

SIGNAL_BUY = 1
SIGNAL_SELL = -1
SIGNAL_NEUTRAL = 0


def _ema(series: pd.Series, length: int) -> pd.Series:
    return series.ewm(span=length, adjust=False).mean()


def _sma(series: pd.Series, length: int) -> pd.Series:
    return series.rolling(window=length, min_periods=length).mean()


def _rsi(close: pd.Series, length: int) -> pd.Series:
    delta = close.diff()
    gain = delta.clip(lower=0)
    loss = (-delta).clip(lower=0)
    avg_gain = gain.ewm(alpha=1 / length, min_periods=length, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1 / length, min_periods=length, adjust=False).mean()
    rs = avg_gain / avg_loss.replace(0, pd.NA)
    return 100 - (100 / (1 + rs))


def _atr(high: pd.Series, low: pd.Series, close: pd.Series, length: int) -> pd.Series:
    prev_close = close.shift(1)
    tr = pd.concat(
        [high - low, (high - prev_close).abs(), (low - prev_close).abs()],
        axis=1,
    ).max(axis=1)
    return tr.ewm(alpha=1 / length, min_periods=length, adjust=False).mean()


def apply_strategy(df: pd.DataFrame) -> pd.DataFrame:
    """
    Apply EMA / RSI / Volume strategy with dynamic ATR stop-loss.

    Buy  (1) : EMA20 > EMA50  AND  RSI14 > 50  AND  Volume > 20-day Vol SMA
    Sell (-1): EMA20 < EMA50  OR   RSI14 < 40
    Neutral(0): otherwise
    """
    empty_cols = [
        "EMA_20", "EMA_50", "RSI_14", "ATR_14", "Volume_SMA_20",
        "Dynamic_Stop_Loss", "Signal",
    ]

    if df.empty or "Close" not in df.columns:
        out = df.copy()
        for col in empty_cols:
            out[col] = pd.NA if col != "Signal" else SIGNAL_NEUTRAL
        return out

    out = df.copy()
    out["EMA_20"] = _ema(out["Close"], EMA_FAST)
    out["EMA_50"] = _ema(out["Close"], EMA_SLOW)
    out["RSI_14"] = _rsi(out["Close"], RSI_PERIOD)
    out["ATR_14"] = _atr(out["High"], out["Low"], out["Close"], ATR_PERIOD)

    if "Volume" in out.columns:
        out["Volume_SMA_20"] = _sma(out["Volume"], VOLUME_SMA)
    else:
        out["Volume_SMA_20"] = pd.NA

    out["Dynamic_Stop_Loss"] = out["Close"] - ATR_MULTIPLIER * out["ATR_14"]

    signals: list[int] = []
    for _, row in out.iterrows():
        ema_f, ema_s, rsi = row["EMA_20"], row["EMA_50"], row["RSI_14"]
        vol, vol_sma = row.get("Volume"), row.get("Volume_SMA_20")

        if pd.isna(ema_f) or pd.isna(ema_s) or pd.isna(rsi):
            signals.append(SIGNAL_NEUTRAL)
        elif ema_f > ema_s and rsi > RSI_BUY_THRESHOLD:
            if pd.notna(vol) and pd.notna(vol_sma) and vol > vol_sma:
                signals.append(SIGNAL_BUY)
            else:
                signals.append(SIGNAL_NEUTRAL)
        elif ema_f < ema_s or rsi < RSI_SELL_THRESHOLD:
            signals.append(SIGNAL_SELL)
        else:
            signals.append(SIGNAL_NEUTRAL)

    out["Signal"] = signals
    return out


def classify_latest_signal(df: pd.DataFrame) -> str:
    """Return human-readable label for the most recent bar."""
    if df.empty or "Signal" not in df.columns:
        return "No Data"

    last_sig = int(df["Signal"].iloc[-1])
    prev_sig = int(df["Signal"].iloc[-2]) if len(df) > 1 else SIGNAL_NEUTRAL

    if last_sig == SIGNAL_BUY and prev_sig != SIGNAL_BUY:
        return "Fresh Buy Signal"
    if last_sig == SIGNAL_SELL:
        return "Exit"
    if last_sig == SIGNAL_BUY:
        return "Hold"
    return "Neutral"
