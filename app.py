"""
Quantitative Stock Analytics & Screener — Streamlit Dashboard.

Layers:
  1. data_engine      — OHLCV data via yfinance
  2. strategy_engine  — EMA / RSI indicators and signals
  3. risk_manager     — 1% risk position sizing
  4. backtest_engine  — Strategy vs buy-and-hold simulation
"""

from __future__ import annotations

import pandas as pd
import streamlit as st

from backtest_engine import run_backtest
from data_engine import NIFTY_50_TICKERS, fetch_multiple, fetch_ohlcv
from risk_manager import calculate_position_size
from strategy_engine import build_screener_table

st.set_page_config(
    page_title="Quant Stock Analytics",
    page_icon="📈",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.title("Quantitative Stock Analytics & Screener")
st.caption("EMA(20/50) + RSI(14) strategy · Nifty 50 universe · 1% risk position sizing")

with st.sidebar:
    st.header("Risk Calculator")
    st.markdown("Size positions so the **maximum loss never exceeds 1%** of total capital.")

    total_capital = st.number_input(
        "Total Capital (₹)",
        min_value=0.0,
        value=500_000.0,
        step=10_000.0,
        format="%.0f",
    )
    entry_price = st.number_input(
        "Entry Price (₹)",
        min_value=0.0,
        value=2_500.0,
        step=10.0,
        format="%.2f",
    )
    stop_loss = st.number_input(
        "Stop Loss (₹)",
        min_value=0.0,
        value=2_400.0,
        step=10.0,
        format="%.2f",
    )

    if st.button("Calculate Position Size", use_container_width=True):
        shares = calculate_position_size(total_capital, entry_price, stop_loss)
        if shares <= 0:
            st.error("Invalid inputs — stop-loss must be below entry price.")
        else:
            risk_per_share = entry_price - stop_loss
            max_loss = shares * risk_per_share
            st.success(f"Buy {shares} shares")
            col_a, col_b = st.columns(2)
            col_a.metric("Shares to Buy", shares)
            col_b.metric("Position Value", f"₹{shares * entry_price:,.2f}")
            st.metric("Max Risk", f"₹{max_loss:,.2f}")
            st.caption(f"Risk per share: ₹{risk_per_share:.2f}")

    st.divider()
    st.markdown("**Strategy Rules**")
    st.markdown(
        """
        - **Buy:** 20 EMA > 50 EMA **and** RSI > 50
        - **Exit:** 20 EMA < 50 EMA **or** RSI < 40
        - **Hold:** Buy criteria still met (ongoing)
        """
    )

tab_screener, tab_backtest = st.tabs(["Live Market Screener", "Backtesting Engine"])


def _highlight_signals(row: pd.Series) -> list[str]:
    signal = row.get("Signal", "")
    if signal == "Fresh Buy":
        return ["background-color: #1b4332; color: #95d5b2"] * len(row)
    if signal == "Hold":
        return ["background-color: #1d3557; color: #a8dadc"] * len(row)
    if signal == "Exit":
        return ["background-color: #4a1515; color: #f4a261"] * len(row)
    return [""] * len(row)


with tab_screener:
    st.subheader("Nifty 50 Live Screener")
    st.markdown(
        "Scans **50 Nifty stocks** using **6 months** of daily OHLCV data. "
        "Signals refresh on each run."
    )

    if st.button("Run Screener", type="primary", key="run_screener"):
        with st.spinner("Fetching market data and computing signals…"):
            ticker_data = fetch_multiple(NIFTY_50_TICKERS, period="6mo")
            screener_df = build_screener_table(ticker_data)
            st.session_state["screener_df"] = screener_df

    if "screener_df" in st.session_state:
        df = st.session_state["screener_df"]
        fresh = int((df["Signal"] == "Fresh Buy").sum())
        hold = int((df["Signal"] == "Hold").sum())
        exit_cnt = int((df["Signal"] == "Exit").sum())

        m1, m2, m3, m4 = st.columns(4)
        m1.metric("Fresh Buy", fresh)
        m2.metric("Hold", hold)
        m3.metric("Exit", exit_cnt)
        m4.metric("Universe", len(df))
        st.dataframe(df.style.apply(_highlight_signals, axis=1), use_container_width=True, hide_index=True)
    else:
        st.info("Click **Run Screener** to fetch live signals across the Nifty 50 universe.")

with tab_backtest:
    st.subheader("Strategy Backtest")
    st.markdown(
        "Select a stock and backtest the EMA/RSI strategy over **2 years** "
        "of daily data vs a buy-and-hold benchmark."
    )

    selected_ticker = st.selectbox(
        "Select Stock",
        options=NIFTY_50_TICKERS,
        index=0,
        key="backtest_ticker",
    )

    if st.button("Run Backtest", type="primary", key="run_backtest"):
        with st.spinner(f"Backtesting {selected_ticker}…"):
            hist = fetch_ohlcv(selected_ticker, period="2y")
            result = run_backtest(hist)
            st.session_state["backtest_result"] = result
            st.session_state["backtest_ticker_label"] = selected_ticker

    if "backtest_result" in st.session_state:
        result = st.session_state["backtest_result"]
        label = st.session_state.get("backtest_ticker_label", selected_ticker)

        c1, c2, c3 = st.columns(3)
        c1.metric("Strategy Return", f"{result.strategy_return_pct:+.2f}%")
        c2.metric("Buy & Hold Return", f"{result.buy_hold_return_pct:+.2f}%")
        c3.metric("Trades Entered", result.trade_count)

        alpha = result.strategy_return_pct - result.buy_hold_return_pct
        st.caption(f"Alpha (Strategy − Buy & Hold): **{alpha:+.2f}%** · {label}")

        if not result.equity_curve.empty:
            chart_df = result.equity_curve.copy()
            chart_df.index = pd.to_datetime(chart_df.index)
            if chart_df.index.tz is not None:
                chart_df.index = chart_df.index.tz_convert("UTC").tz_localize(None)
            chart_df = chart_df.rename(
                columns={
                    "strategy_cumulative": "Strategy",
                    "buy_hold_cumulative": "Buy & Hold",
                }
            )
            st.line_chart(chart_df, use_container_width=True)
        else:
            st.warning("Insufficient data to plot equity curve.")
    else:
        st.info("Select a stock and click **Run Backtest** to compare strategy vs buy-and-hold.")
