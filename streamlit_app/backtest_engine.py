"""
Backtest Engine — Layer 4: Returns, drawdown, win-rate, and trade log.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd

from strategy_engine import SIGNAL_BUY, SIGNAL_NEUTRAL, SIGNAL_SELL

TRANSACTION_COST = 0.001  # 0.1% per buy or sell execution


@dataclass
class BacktestResult:
    cumulative_market: pd.Series
    cumulative_strategy: pd.Series
    win_rate_pct: float
    max_drawdown_pct: float
    trade_log: pd.DataFrame
    strategy_return_pct: float
    market_return_pct: float


def _max_drawdown(cumulative: pd.Series) -> float:
    """Maximum drawdown (%) from a cumulative return series."""
    if cumulative.empty:
        return 0.0
    running_max = cumulative.cummax()
    drawdown = (cumulative / running_max) - 1.0
    return round(float(drawdown.min() * 100), 2)


def _build_trade_log(df: pd.DataFrame) -> pd.DataFrame:
    """
    Extract round-trip trades from signal transitions.

    Entry: Signal transitions to BUY (1) from non-BUY.
    Exit : Signal transitions away from BUY while in position.
    """
    trades: list[dict] = []
    in_position = False
    entry_date = None
    entry_price = None

    signals = df["Signal"].values
    closes = df["Close"].values
    dates = df.index

    for i in range(len(df)):
        sig = int(signals[i])
        prev_sig = int(signals[i - 1]) if i > 0 else SIGNAL_NEUTRAL
        price = float(closes[i])
        date = dates[i]

        if not in_position and sig == SIGNAL_BUY and prev_sig != SIGNAL_BUY:
            in_position = True
            entry_date = date
            entry_price = price

        elif in_position and sig != SIGNAL_BUY:
            exit_price = price
            gross_pnl_pct = ((exit_price - entry_price) / entry_price) * 100
            net_pnl_pct = gross_pnl_pct - (TRANSACTION_COST * 2 * 100)  # buy + sell fees
            trades.append({
                "Entry Date": pd.Timestamp(entry_date).strftime("%Y-%m-%d"),
                "Entry Price": round(entry_price, 2),
                "Exit Date": pd.Timestamp(date).strftime("%Y-%m-%d"),
                "Exit Price": round(exit_price, 2),
                "Trade P&L (%)": round(net_pnl_pct, 2),
            })
            in_position = False
            entry_date = None
            entry_price = None

    if not trades:
        return pd.DataFrame(
            columns=["Entry Date", "Entry Price", "Exit Date", "Exit Price", "Trade P&L (%)"]
        )
    return pd.DataFrame(trades)


def calculate_returns(df_with_signals: pd.DataFrame) -> BacktestResult:
    """
    Simulate strategy returns vs market with transaction costs.

    Pipeline
    --------
    1. daily_market_return   = Close.pct_change()
    2. position              = Signal.shift(1) == BUY  (long-only, no look-ahead)
    3. strategy_daily_return = market_return * position
    4. Deduct 0.1% on each buy/sell execution day
    5. Build trade log from signal transitions

    Parameters
    ----------
    df_with_signals : pd.DataFrame
        Output of strategy_engine.apply_strategy.

    Returns
    -------
    BacktestResult
        cumulative_market, cumulative_strategy, win_rate_pct,
        max_drawdown_pct, trade_log, strategy_return_pct, market_return_pct
    """
    empty = pd.Series(dtype=float)
    empty_log = pd.DataFrame(
        columns=["Entry Date", "Entry Price", "Exit Date", "Exit Price", "Trade P&L (%)"]
    )

    if df_with_signals.empty or "Close" not in df_with_signals.columns:
        return BacktestResult(empty, empty, 0.0, 0.0, empty_log, 0.0, 0.0)

    df = df_with_signals.copy()
    daily_market = df["Close"].pct_change().fillna(0.0)

    signal = df["Signal"].fillna(SIGNAL_NEUTRAL).astype(int)
    prev_signal = signal.shift(1).fillna(SIGNAL_NEUTRAL).astype(int)

    in_position = prev_signal == SIGNAL_BUY
    daily_strategy = daily_market * in_position.astype(float)

    entries = (signal == SIGNAL_BUY) & (prev_signal != SIGNAL_BUY)
    exits = (prev_signal == SIGNAL_BUY) & (signal != SIGNAL_BUY)
    daily_strategy -= (entries | exits) * TRANSACTION_COST

    cumulative_market = (1 + daily_market).cumprod()
    cumulative_strategy = (1 + daily_strategy).cumprod()

    trade_log = _build_trade_log(df)

    if not trade_log.empty:
        wins = (trade_log["Trade P&L (%)"] > 0).sum()
        win_rate = round(float(wins / len(trade_log) * 100), 2)
    else:
        win_rate = 0.0

    max_dd = _max_drawdown(cumulative_strategy)
    strat_ret = round(float((cumulative_strategy.iloc[-1] - 1) * 100), 2)
    mkt_ret = round(float((cumulative_market.iloc[-1] - 1) * 100), 2)

    cumulative_market.name = "Market"
    cumulative_strategy.name = "Strategy"

    return BacktestResult(
        cumulative_market=cumulative_market,
        cumulative_strategy=cumulative_strategy,
        win_rate_pct=win_rate,
        max_drawdown_pct=max_dd,
        trade_log=trade_log,
        strategy_return_pct=strat_ret,
        market_return_pct=mkt_ret,
    )
