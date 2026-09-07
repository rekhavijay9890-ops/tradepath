"""
Quantitative Stock Analytics & Screener — Main UI & Router.

Wiring
------
data_engine.fetch_historical_data  →  strategy_engine.apply_strategy
                                   →  backtest_engine.calculate_returns
risk_manager.calculate_position_size  →  Sidebar
"""

from __future__ import annotations

import pandas as pd
import streamlit as st

# ── Page config (must be first Streamlit command) ─────────────────────────────
st.set_page_config(
    page_title="Quant Stock Analytics",
    page_icon="📈",
    layout="wide",
    initial_sidebar_state="expanded",
    menu_items={
        "Get Help": "https://github.com/rekhavijay9890-ops/tradepath",
        "Report a bug": None,
        "About": "Quant Stock Analytics — Nifty 50 screener & backtester. Educational use only.",
    },
)

try:
    import plotly.graph_objects as go
    from plotly.subplots import make_subplots
except ImportError:
    st.error("Missing packages. Run: `pip install -r requirements.txt`")
    st.stop()

from backtest_engine import calculate_returns
from data_engine import NIFTY_50_SYMBOLS, NIFTY_SYMBOLS, fetch_historical_data
from risk_manager import calculate_position_size
from strategy_engine import SIGNAL_BUY, SIGNAL_SELL, apply_strategy, classify_latest_signal

# Clean web-page look (hide Streamlit chrome)
st.markdown(
    """
    <style>
    #MainMenu, footer, header[data-testid="stHeader"] {visibility: hidden;}
    .block-container { padding-top: 1.5rem; max-width: 1100px; }
    .web-hero {
        background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%);
        border: 1px solid #334155; border-radius: 16px;
        padding: 2rem 2.5rem; margin-bottom: 1.5rem;
    }
    .web-hero h1 { color: #f8fafc; font-size: 1.85rem; margin: 0 0 0.5rem 0; }
    .web-hero p { color: #94a3b8; margin: 0; font-size: 1rem; }
    div[data-testid="stMetric"] {
        background: #1e293b; border: 1px solid #334155;
        border-radius: 10px; padding: 0.6rem 1rem;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

st.markdown(
    """
    <div class="web-hero">
        <h1>📈 Quant Stock Analytics</h1>
        <p>Nifty 50 screener · EMA/RSI strategy · Backtesting · 1% risk calculator</p>
    </div>
    """,
    unsafe_allow_html=True,
)

# ── Sidebar ───────────────────────────────────────────────────────────────────
with st.sidebar:
    st.header("⚙️ Controls")

    st.subheader("Risk Calculator")
    capital = st.number_input("Total Capital (₹)", min_value=0.0, value=500_000.0, step=10_000.0)
    entry_price = st.number_input("Entry Price (₹)", min_value=0.0, value=2_500.0, step=10.0)
    stop_loss = st.number_input("Stop Loss (₹)", min_value=0.0, value=2_400.0, step=10.0)

    if st.button("Calculate Position Size", use_container_width=True):
        shares = calculate_position_size(capital, entry_price, stop_loss)
        if shares <= 0:
            st.error("Invalid inputs — ensure stop-loss is below entry price.")
        else:
            risk_per_share = entry_price - stop_loss
            max_loss = shares * risk_per_share
            st.success(f"Buy **{shares}** shares")
            st.metric("Position Value", f"₹{shares * entry_price:,.2f}")
            st.metric("Max Loss (1%)", f"₹{max_loss:,.2f}")

    st.divider()
    st.subheader("Price Range Filter")
    st.caption("Screener shows only stocks within this closing-price range.")
    min_price = st.number_input("Min Price (₹)", min_value=0.0, value=100.0, step=50.0)
    max_price = st.number_input("Max Price (₹)", min_value=0.0, value=5_000.0, step=100.0)

    st.divider()
    st.markdown("**Strategy Rules**")
    st.markdown(
        """
        - **Buy:** EMA20 > EMA50, RSI > 50, Vol > 20d SMA
        - **Sell:** EMA20 < EMA50 or RSI < 40
        - **Stop:** Close − 1.5 × ATR(14)
        - **Fees:** 0.1% per trade leg in backtest
        """
    )

# ── Tabs ──────────────────────────────────────────────────────────────────────
tab_screener, tab_backtest = st.tabs(["📊 Live Screener", "🔬 Backtester"])


def _style_screener(row: pd.Series) -> list[str]:
    label = row.get("Signal", "")
    if label == "Fresh Buy Signal":
        return ["background-color: #D1FAE5; color: #065F46"] * len(row)
    if label == "Exit":
        return ["background-color: #FEE2E2; color: #991B1B"] * len(row)
    return [""] * len(row)


def _build_candlestick_chart(df: pd.DataFrame, symbol: str) -> go.Figure:
    """Interactive Plotly candlestick with EMAs and buy/sell markers."""
    fig = make_subplots(
        rows=2, cols=1, shared_xaxes=True,
        vertical_spacing=0.03,
        row_heights=[0.75, 0.25],
        subplot_titles=(f"{symbol.replace('.NS', '')} — Price & Signals", "Volume"),
    )

    fig.add_trace(
        go.Candlestick(
            x=df.index,
            open=df["Open"], high=df["High"],
            low=df["Low"], close=df["Close"],
            name="OHLC",
            increasing_line_color="#22C55E",
            decreasing_line_color="#EF4444",
        ),
        row=1, col=1,
    )

    if "EMA_20" in df.columns:
        fig.add_trace(
            go.Scatter(x=df.index, y=df["EMA_20"], name="EMA 20",
                       line=dict(color="#3B82F6", width=1.5)),
            row=1, col=1,
        )
    if "EMA_50" in df.columns:
        fig.add_trace(
            go.Scatter(x=df.index, y=df["EMA_50"], name="EMA 50",
                       line=dict(color="#F59E0B", width=1.5)),
            row=1, col=1,
        )

    buys = df[df["Signal"] == SIGNAL_BUY]
    sells = df[df["Signal"] == SIGNAL_SELL]

    if not buys.empty:
        fig.add_trace(
            go.Scatter(
                x=buys.index, y=buys["Low"] * 0.985,
                mode="markers",
                marker=dict(symbol="triangle-up", size=12, color="#16A34A"),
                name="Buy",
            ),
            row=1, col=1,
        )
    if not sells.empty:
        fig.add_trace(
            go.Scatter(
                x=sells.index, y=sells["High"] * 1.015,
                mode="markers",
                marker=dict(symbol="triangle-down", size=12, color="#DC2626"),
                name="Sell",
            ),
            row=1, col=1,
        )

    if "Volume" in df.columns:
        colors = ["#22C55E" if c >= o else "#EF4444"
                  for o, c in zip(df["Open"], df["Close"])]
        fig.add_trace(
            go.Bar(x=df.index, y=df["Volume"], name="Volume",
                   marker_color=colors, opacity=0.6),
            row=2, col=1,
        )

    fig.update_layout(
        height=650,
        xaxis_rangeslider_visible=False,
        template="plotly_dark",
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        margin=dict(l=40, r=40, t=60, b=40),
    )
    fig.update_xaxes(type="date")
    return fig


# ── Tab 1: Live Screener ──────────────────────────────────────────────────────
with tab_screener:
    st.subheader("Nifty Live Screener")
    st.markdown(
        f"Scans **{len(NIFTY_SYMBOLS)}** symbols · 6-month daily data · "
        f"filtered to ₹{min_price:,.0f} – ₹{max_price:,.0f}"
    )

    if st.button("▶ Run Screener", type="primary", key="run_screener"):
        rows: list[dict] = []
        bar = st.progress(0, text="Fetching data…")
        for i, symbol in enumerate(NIFTY_SYMBOLS):
            try:
                raw = fetch_historical_data(symbol, period="6m")
                strat = apply_strategy(raw)
                if strat.empty:
                    continue
                close = float(strat["Close"].iloc[-1])
                if not (min_price <= close <= max_price):
                    continue
                label = classify_latest_signal(strat)
                last = strat.iloc[-1]
                rows.append({
                    "Symbol": symbol.replace(".NS", ""),
                    "Close (₹)": round(close, 2),
                    "EMA 20": round(float(last["EMA_20"]), 2) if pd.notna(last["EMA_20"]) else None,
                    "EMA 50": round(float(last["EMA_50"]), 2) if pd.notna(last["EMA_50"]) else None,
                    "RSI 14": round(float(last["RSI_14"]), 2) if pd.notna(last["RSI_14"]) else None,
                    "ATR Stop (₹)": round(float(last["Dynamic_Stop_Loss"]), 2)
                    if pd.notna(last.get("Dynamic_Stop_Loss")) else None,
                    "Signal": label,
                })
            except Exception:
                pass
            bar.progress((i + 1) / len(NIFTY_SYMBOLS), text=f"Scanning {symbol}…")
        bar.empty()
        st.session_state["screener_df"] = pd.DataFrame(rows)

    if "screener_df" in st.session_state and not st.session_state["screener_df"].empty:
        sdf = st.session_state["screener_df"]
        fresh = int((sdf["Signal"] == "Fresh Buy Signal").sum())
        exit_n = int((sdf["Signal"] == "Exit").sum())

        c1, c2, c3, c4 = st.columns(4)
        c1.metric("Fresh Buy", fresh)
        c2.metric("Exit", exit_n)
        c3.metric("In Range", len(sdf))
        c4.metric("Scanned", len(NIFTY_SYMBOLS))

        st.dataframe(
            sdf.style.apply(_style_screener, axis=1),
            use_container_width=True,
            hide_index=True,
        )
    elif "screener_df" in st.session_state:
        st.warning(f"No stocks found in ₹{min_price:,.0f} – ₹{max_price:,.0f} range. Widen the filter.")
    else:
        st.info("Click **▶ Run Screener** to scan Nifty stocks within your price range.")

# ── Tab 2: Backtester ─────────────────────────────────────────────────────────
with tab_backtest:
    st.subheader("Strategy Backtester")
    st.markdown("2-year simulation · 0.1% fee per trade leg · long-only")

    col_sel, col_btn = st.columns([3, 1])
    with col_sel:
        selected = st.selectbox(
            "Select Stock",
            options=NIFTY_50_SYMBOLS,
            format_func=lambda s: s.replace(".NS", ""),
            key="bt_stock",
        )
    with col_btn:
        run_bt = st.button("▶ Run Backtest", type="primary", use_container_width=True)

    if run_bt:
        with st.spinner(f"Backtesting {selected}…"):
            hist = fetch_historical_data(selected, period="2y")
            if hist.empty:
                st.error("No data returned.")
            else:
                strat_df = apply_strategy(hist)
                bt = calculate_returns(strat_df)
                st.session_state["bt_result"] = bt
                st.session_state["bt_df"] = strat_df
                st.session_state["bt_symbol"] = selected

    if "bt_result" in st.session_state:
        bt = st.session_state["bt_result"]
        strat_df = st.session_state["bt_df"]
        sym = st.session_state.get("bt_symbol", selected)

        st.markdown("##### KPI Dashboard")
        k1, k2, k3, k4 = st.columns(4)
        k1.metric("Strategy Return", f"{bt.strategy_return_pct:+.2f}%")
        k2.metric("Buy & Hold Return", f"{bt.market_return_pct:+.2f}%")
        k3.metric("Win Rate", f"{bt.win_rate_pct:.1f}%")
        k4.metric("Max Drawdown", f"{bt.max_drawdown_pct:.2f}%")

        alpha = bt.strategy_return_pct - bt.market_return_pct
        st.caption(f"Alpha: **{alpha:+.2f}%** · {sym.replace('.NS', '')} · 2-year daily")

        st.markdown("##### Price Chart with Signals")
        fig = _build_candlestick_chart(strat_df, sym)
        st.plotly_chart(fig, use_container_width=True)

        st.markdown("##### Cumulative Returns")
        if not bt.cumulative_strategy.empty:
            cum_df = pd.DataFrame({
                "Strategy": bt.cumulative_strategy,
                "Buy & Hold": bt.cumulative_market,
            })
            cum_df.index = pd.to_datetime(cum_df.index)
            if cum_df.index.tz is not None:
                cum_df.index = cum_df.index.tz_convert("UTC").tz_localize(None)
            st.line_chart(cum_df, use_container_width=True)

        with st.expander("📋 View Detailed Trade Log", expanded=False):
            if bt.trade_log.empty:
                st.info("No completed round-trip trades in this period.")
            else:
                st.dataframe(bt.trade_log, use_container_width=True, hide_index=True)
                avg_pnl = bt.trade_log["Trade P&L (%)"].mean()
                st.caption(f"Trades: {len(bt.trade_log)} · Avg P&L: {avg_pnl:+.2f}%")
    else:
        st.info("Select a stock and click **▶ Run Backtest**.")

st.divider()
st.caption("Educational tool only · Not financial advice · Data via Yahoo Finance")
