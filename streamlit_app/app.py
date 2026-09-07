"""
Quantitative Stock Analytics & Screener — Main UI & Router.

Wiring
------
data_engine.fetch_historical_data  →  strategy_engine.apply_strategy
                                   →  backtest_engine.calculate_returns
risk_manager.calculate_position_size  →  Sidebar
"""

from __future__ import annotations

from datetime import date, timedelta

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

from backtest_engine import (
    TEST_RATIO,
    TRAIN_RATIO,
    build_benchmark_comparison,
    run_backtest_analysis,
)
from data_engine import NIFTY_50_SYMBOLS, NIFTY_SYMBOLS, fetch_historical_data
from risk_manager import calculate_position_size
from strategy_engine import SIGNAL_BUY, SIGNAL_SELL, apply_strategy, classify_latest_signal


def _return_color(value: float) -> str:
    if value > 0:
        return "#16a34a"
    if value < 0:
        return "#dc2626"
    return "#0f172a"


def _kpi_card(label: str, value: str, value_color: str = "#0f172a") -> None:
    """HTML KPI card — reliable contrast on Streamlit light theme."""
    st.markdown(
        f"""
        <div style="
            background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%);
            border: 1px solid #cbd5e1;
            border-radius: 12px;
            padding: 1rem 1.1rem;
            box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
        ">
            <div style="color:#64748b;font-size:0.82rem;font-weight:600;
                        margin-bottom:6px;text-transform:uppercase;letter-spacing:0.03em;">
                {label}
            </div>
            <div style="color:{value_color};font-size:1.65rem;font-weight:700;line-height:1.2;">
                {value}
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def _kpi_row(items: list[tuple[str, str, str]]) -> None:
    cols = st.columns(len(items))
    for col, (label, value, color) in zip(cols, items):
        with col:
            _kpi_card(label, value, color)


def _format_profit_factor(value: float) -> str:
    if value == float("inf"):
        return "∞"
    return f"{value:.2f}"


def _regime_style(regime: str) -> tuple[str, str]:
    """Return (background, text) colors for market regime badge."""
    styles = {
        "Bull": ("#dcfce7", "#166534"),
        "Bear": ("#fee2e2", "#991b1b"),
        "Sideways": ("#e0e7ff", "#3730a3"),
        "High Volatility": ("#ffedd5", "#c2410c"),
    }
    return styles.get(regime, ("#f1f5f9", "#475569"))


def _regime_badge(regime: str) -> None:
    bg, fg = _regime_style(regime)
    st.markdown(
        f"""
        <div style="
            display:inline-block;
            background:{bg};
            color:{fg};
            border:1px solid {fg}33;
            border-radius:999px;
            padding:0.35rem 0.9rem;
            font-weight:700;
            font-size:0.9rem;
        ">
            Market Regime: {regime}
        </div>
        """,
        unsafe_allow_html=True,
    )


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

        _kpi_row([
            ("Fresh Buy", str(fresh), "#16a34a"),
            ("Exit", str(exit_n), "#dc2626"),
            ("In Range", str(len(sdf)), "#0f172a"),
            ("Scanned", str(len(NIFTY_SYMBOLS)), "#0f172a"),
        ])

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
    st.markdown(
        f"Date-range backtest · **{int(TRAIN_RATIO * 100)}% train / {int(TEST_RATIO * 100)}% OOS** "
        "· 0.1% fee per trade leg · long-only"
    )

    _default_end = date.today()
    _default_start = _default_end - timedelta(days=730)

    col_sel, col_start, col_end, col_btn = st.columns([2, 1.2, 1.2, 1])
    with col_sel:
        selected = st.selectbox(
            "Select Stock",
            options=NIFTY_50_SYMBOLS,
            format_func=lambda s: s.replace(".NS", ""),
            key="bt_stock",
        )
    with col_start:
        bt_start = st.date_input("Start Date", value=_default_start, key="bt_start")
    with col_end:
        bt_end = st.date_input("End Date", value=_default_end, key="bt_end")
    with col_btn:
        st.write("")
        st.write("")
        run_bt = st.button("▶ Run Backtest", type="primary", use_container_width=True)

    if run_bt:
        if bt_start >= bt_end:
            st.error("Start Date must be before End Date.")
        else:
            with st.spinner(f"Backtesting {selected}…"):
                hist = fetch_historical_data(
                    selected,
                    start=bt_start.isoformat(),
                    end=bt_end.isoformat(),
                )
                if hist.empty:
                    st.error("No data returned for the selected date range.")
                elif len(hist) < 60:
                    st.error("Need at least 60 trading days in the selected range.")
                else:
                    strat_df = apply_strategy(hist)
                    report = run_backtest_analysis(strat_df)
                    st.session_state["bt_report"] = report
                    st.session_state["bt_df"] = strat_df
                    st.session_state["bt_symbol"] = selected
                    st.session_state["bt_start"] = bt_start.isoformat()
                    st.session_state["bt_end"] = bt_end.isoformat()

    if "bt_report" in st.session_state:
        report = st.session_state["bt_report"]
        bt = report.full
        oos = report.test
        strat_df = st.session_state["bt_df"]
        sym = st.session_state.get("bt_symbol", selected)
        range_label = (
            f"{st.session_state.get('bt_start', '')} → {st.session_state.get('bt_end', '')}"
        )

        _regime_badge(report.regime)

        st.markdown(
            f"**Train/Test split:** {int(report.train_ratio * 100)}% in-sample "
            f"({report.train_start} → {report.train_end}) · "
            f"{int(TEST_RATIO * 100)}% out-of-sample "
            f"({report.test_start} → {report.test_end})"
        )

        st.markdown("##### Full-Period KPI Dashboard")
        _kpi_row([
            ("Strategy Return", f"{bt.strategy_return_pct:+.2f}%", _return_color(bt.strategy_return_pct)),
            ("Buy & Hold Return", f"{bt.market_return_pct:+.2f}%", _return_color(bt.market_return_pct)),
            ("CAGR", f"{bt.cagr_pct:+.2f}%", _return_color(bt.cagr_pct)),
            ("Sharpe Ratio", f"{bt.sharpe_ratio:.2f}", "#2563eb"),
        ])
        _kpi_row([
            ("Total Trades", str(bt.total_trades), "#0f172a"),
            ("Avg Profit/Loss", f"{bt.avg_profit_loss_pct:+.2f}%", _return_color(bt.avg_profit_loss_pct)),
            ("Profit Factor", _format_profit_factor(bt.profit_factor), "#7c3aed"),
            ("Win Rate", f"{bt.win_rate_pct:.1f}%", "#2563eb"),
        ])
        _kpi_row([
            ("Largest Win", f"{bt.largest_win_pct:+.2f}%", "#16a34a"),
            ("Largest Loss", f"{bt.largest_loss_pct:+.2f}%", "#dc2626"),
            ("Max Consec. Losses", str(bt.max_consecutive_losses), "#dc2626"),
            ("Max Drawdown", f"{bt.max_drawdown_pct:.2f}%", "#dc2626"),
        ])

        st.markdown(f"##### Out-of-Sample KPIs ({int(TEST_RATIO * 100)}% Test)")
        st.caption(f"Unseen hold-out period: {report.test_start} → {report.test_end}")
        _kpi_row([
            ("Return", f"{oos.strategy_return_pct:+.2f}%", _return_color(oos.strategy_return_pct)),
            ("CAGR", f"{oos.cagr_pct:+.2f}%", _return_color(oos.cagr_pct)),
            ("Win Rate", f"{oos.win_rate_pct:.1f}%", "#2563eb"),
            ("Profit Factor", _format_profit_factor(oos.profit_factor), "#7c3aed"),
        ])
        _kpi_row([
            ("Max Drawdown", f"{oos.max_drawdown_pct:.2f}%", "#dc2626"),
            ("Sharpe", f"{oos.sharpe_ratio:.2f}", "#2563eb"),
            ("# Trades", str(oos.total_trades), "#0f172a"),
            ("Buy & Hold (OOS)", f"{oos.market_return_pct:+.2f}%", _return_color(oos.market_return_pct)),
        ])

        st.markdown("##### Benchmark — Strategy vs Buy & Hold")
        benchmark_df = build_benchmark_comparison(report.train, report.test)
        st.dataframe(benchmark_df, use_container_width=True, hide_index=True)

        alpha = bt.strategy_return_pct - bt.market_return_pct
        st.caption(
            f"Alpha (full period): **{alpha:+.2f}%** · {sym.replace('.NS', '')} · {range_label}"
        )

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
    else:
        st.info("Select a stock, set the date range, and click **▶ Run Backtest**.")

st.divider()
st.caption("Educational tool only · Not financial advice · Data via Yahoo Finance")
