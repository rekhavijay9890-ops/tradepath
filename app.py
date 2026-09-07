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