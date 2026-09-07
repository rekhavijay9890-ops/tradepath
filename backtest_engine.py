"""
Backtest Engine — Layer 4: Strategy performance vs buy-and-hold benchmark.

Simulates long-only entries/exits from strategy signals and computes
cumulative return series suitable for Streamlit line charts.
"""

from __future__ import annotations

from dataclasses import dataclass

import pandas as pd

from strategy_engine import add_signals


@dataclass
class BacktestResult:
    equity_curve: pd.DataFrame
    strategy_return_pct: float
    buy_hold_return_pct: float
    trade_count: int


def _simulate_strategy(df: pd.DataFrame) -> pd.Series:
    """Long-only simulation: enter on buy, exit on exit raw signal."""
    signals = add_signals(df)
    position = 0
    strategy_returns: list[float] = []
    closes = signals["Close"].values
    raw = signals["raw_signal"].values

    for i in range(len(signals)):
        if i == 0:
            strategy_returns.append(0.0)
            if raw[i] == "buy":
                position = 1
            continue

        daily_ret = (closes[i] - closes[i - 1]) / closes[i - 1] if closes[i - 1] != 0 else 0.0
        strategy_returns.append(daily_ret if position == 1 else 0.0)

        if position == 0 and raw[i] == "buy":
            position = 1
        elif position == 1 and raw[i] == "exit":
            position = 0

    return pd.Series(strategy_returns, index=signals.index, name="strategy_return")


def run_backtest(df: pd.DataFrame) -> BacktestResult:
    """Backtest the EMA/RSI strategy against buy-and-hold."""
    if df.empty or len(df) < 2:
        empty = pd.DataFrame(columns=["strategy_cumulative", "buy_hold_cumulative"], dtype=float)
        return BacktestResult(empty, 0.0, 0.0, 0)

    signals = add_signals(df)
    strat_daily = _simulate_strategy(df)
    buy_hold_daily = df["Close"].pct_change().fillna(0.0)

    equity = pd.DataFrame(index=df.index)
    equity["strategy_cumulative"] = (1 + strat_daily).cumprod()
    equity["buy_hold_cumulative"] = (1 + buy_hold_daily).cumprod()

    position = 0
    trades = 0
    for sig in signals["raw_signal"]:
        if position == 0 and sig == "buy":
            position = 1
            trades += 1
        elif position == 1 and sig == "exit":
            position = 0

    strategy_return_pct = (equity["strategy_cumulative"].iloc[-1] - 1) * 100
    buy_hold_return_pct = (equity["buy_hold_cumulative"].iloc[-1] - 1) * 100

    return BacktestResult(
        equity_curve=equity,
        strategy_return_pct=round(float(strategy_return_pct), 2),
        buy_hold_return_pct=round(float(buy_hold_return_pct), 2),
        trade_count=trades,
    )
