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
    total_trades: int
    avg_profit_loss_pct: float
    profit_factor: float
    sharpe_ratio: float
    largest_win_pct: float
    largest_loss_pct: float
    max_consecutive_losses: int
    cagr_pct: float


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


def _max_consecutive_losses(pnls: pd.Series) -> int:
    """Longest streak of losing trades."""
    max_streak = streak = 0
    for pnl in pnls:
        if pnl < 0:
            streak += 1
            max_streak = max(max_streak, streak)
        else:
            streak = 0
    return max_streak


def _profit_factor(pnls: pd.Series) -> float:
    """Gross wins / gross losses. Returns 0 when no losses, capped display handled in UI."""
    gross_profit = pnls[pnls > 0].sum()
    gross_loss = abs(pnls[pnls < 0].sum())
    if gross_loss == 0:
        return float("inf") if gross_profit > 0 else 0.0
    return round(float(gross_profit / gross_loss), 2)


def _sharpe_ratio(daily_returns: pd.Series, periods_per_year: int = 252) -> float:
    """Annualized Sharpe ratio (risk-free rate = 0)."""
    if daily_returns.empty or daily_returns.std() == 0:
        return 0.0
    return round(float(daily_returns.mean() / daily_returns.std() * np.sqrt(periods_per_year)), 2)


def _cagr_pct(cumulative: pd.Series) -> float:
    """Compound annual growth rate from cumulative return series."""
    if cumulative.empty or len(cumulative) < 2:
        return 0.0
    start, end = cumulative.index[0], cumulative.index[-1]
    years = (pd.Timestamp(end) - pd.Timestamp(start)).days / 365.25
    if years <= 0:
        return 0.0
    final_multiple = float(cumulative.iloc[-1])
    if final_multiple <= 0:
        return 0.0
    cagr = (final_multiple ** (1 / years) - 1) * 100
    return round(cagr, 2)


def _empty_result() -> BacktestResult:
    empty = pd.Series(dtype=float)
    empty_log = pd.DataFrame(
        columns=["Entry Date", "Entry Price", "Exit Date", "Exit Price", "Trade P&L (%)"]
    )
    return BacktestResult(
        cumulative_market=empty,
        cumulative_strategy=empty,
        win_rate_pct=0.0,
        max_drawdown_pct=0.0,
        trade_log=empty_log,
        strategy_return_pct=0.0,
        market_return_pct=0.0,
        total_trades=0,
        avg_profit_loss_pct=0.0,
        profit_factor=0.0,
        sharpe_ratio=0.0,
        largest_win_pct=0.0,
        largest_loss_pct=0.0,
        max_consecutive_losses=0,
        cagr_pct=0.0,
    )


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
    if df_with_signals.empty or "Close" not in df_with_signals.columns:
        return _empty_result()

    df = df_with_signals.copy()
    daily_market = df["Close"].pct_change(fill_method=None).fillna(0.0)

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
        pnls = trade_log["Trade P&L (%)"]
        wins = (pnls > 0).sum()
        win_rate = round(float(wins / len(trade_log) * 100), 2)
        total_trades = len(trade_log)
        avg_pnl = round(float(pnls.mean()), 2)
        profit_factor = _profit_factor(pnls)
        largest_win = round(float(pnls.max()), 2)
        largest_loss = round(float(pnls.min()), 2)
        max_consec_losses = _max_consecutive_losses(pnls)
    else:
        win_rate = 0.0
        total_trades = 0
        avg_pnl = 0.0
        profit_factor = 0.0
        largest_win = 0.0
        largest_loss = 0.0
        max_consec_losses = 0

    max_dd = _max_drawdown(cumulative_strategy)
    strat_ret = round(float((cumulative_strategy.iloc[-1] - 1) * 100), 2)
    mkt_ret = round(float((cumulative_market.iloc[-1] - 1) * 100), 2)
    sharpe = _sharpe_ratio(daily_strategy)
    cagr = _cagr_pct(cumulative_strategy)

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
        total_trades=total_trades,
        avg_profit_loss_pct=avg_pnl,
        profit_factor=profit_factor,
        sharpe_ratio=sharpe,
        largest_win_pct=largest_win,
        largest_loss_pct=largest_loss,
        max_consecutive_losses=max_consec_losses,
        cagr_pct=cagr,
    )
