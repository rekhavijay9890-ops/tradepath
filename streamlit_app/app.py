"""
TradePath — Intraday Trading App (Streamlit + 5paisa)
Run: streamlit run streamlit_app/app.py --server.port 8742
"""

from __future__ import annotations

import uuid
from datetime import date

import pandas as pd
import streamlit as st
from dotenv import load_dotenv

load_dotenv()

from broker import (  # noqa: E402
    NSE_SCRIPS,
    create_client,
    credentials_configured,
    fetch_quotes,
    login_oauth,
    login_totp,
    oauth_login_url,
)
from journal import (  # noqa: E402
    add_trade,
    close_trade,
    compute_stats,
    init_journal_state,
)
from market_data import fetch_yahoo_quotes, score_stock  # noqa: E402
from risk import calculate_position, calculate_trade_costs  # noqa: E402

# ── Page config ──────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="TradePath — Intraday App",
    page_icon="📈",
    layout="wide",
    initial_sidebar_state="expanded",
)

init_journal_state()

EMOTIONS = ["CALM", "CONFIDENT", "FEARFUL", "FOMO", "REVENGE", "ANXIOUS", "GREEDY"]
STRATEGIES = ["ORB", "VWAP_RECLAIM", "MOMENTUM", "GAP_FADE", "SWING", "OTHER"]


# ── Sidebar ──────────────────────────────────────────────────────────────────
with st.sidebar:
    st.title("📈 TradePath")
    st.caption("NSE Intraday · 5paisa")
    st.divider()

    page = st.radio(
        "Navigate",
        [
            "🏠 Home",
            "📚 Phase 1: Learn",
            "🧮 Risk Calculator",
            "📊 Screener",
            "📝 Paper Trade",
            "💰 Live Trade",
            "📈 Scale",
            "🔌 5paisa Connect",
        ],
        label_visibility="collapsed",
    )

    st.divider()
    phase = st.session_state.current_phase
    st.metric("Current Phase", f"{phase} / 4")
    if st.session_state.broker_connected:
        st.success("5paisa connected")
    else:
        st.warning("5paisa not connected")

    paper_stats = compute_stats(st.session_state.journal, paper=True)
    st.caption(f"Paper: {paper_stats['sessions']}/30 sessions · P&L ₹{paper_stats['total_pnl']:,.0f}")


# ── Home ─────────────────────────────────────────────────────────────────────
if page == "🏠 Home":
    st.title("Welcome to TradePath")
    st.markdown("Your **step-by-step** intraday trading journey for NSE/BSE.")

    st.info(
        "**Start here:** Go to **Phase 1: Learn** → then **Paper Trade** → only then **Live Trade**. "
        "Most beginners lose money because they skip the learning phase."
    )

    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Phase 1", "Learn", "2–4 weeks")
    c2.metric("Phase 2", "Paper Trade", "30+ sessions")
    c3.metric("Phase 3", "Go Live", "₹25K–50K")
    c4.metric("Phase 4", "Scale", "3 profit months")

    st.subheader("What to do today")
    st.markdown("""
    1. Click **Phase 1: Learn** in the sidebar
    2. Read about order types and stop-loss
    3. Open **Screener** — see which stocks moved today
    4. **Do NOT trade with real money today**
    """)

    st.subheader("Your progress")
    paper = compute_stats(st.session_state.journal, paper=True)
    live = compute_stats(st.session_state.journal, paper=False)

    col1, col2 = st.columns(2)
    with col1:
        st.markdown("**Paper trading**")
        st.progress(min(paper["sessions"] / 30, 1.0))
        st.write(f"Sessions: {paper['sessions']}/30 · Expectancy: ₹{paper['expectancy']}")
    with col2:
        st.markdown("**Live trading**")
        st.write(f"Trades: {live['trades']} · P&L: ₹{live['total_pnl']:,.0f}")


# ── Phase 1: Learn ───────────────────────────────────────────────────────────
elif page == "📚 Phase 1: Learn":
    st.title("Phase 1: Learn")
    st.markdown("Read these before placing any trade. Takes 2–4 weeks.")

    with st.expander("📌 Order Types", expanded=True):
        st.markdown("""
        | Order | When to use |
        |-------|-------------|
        | **Market** | Buy/sell immediately at current price |
        | **Limit** | Buy/sell only at your price |
        | **Stop-Loss (SL)** | Auto-sell if price drops — **always use this** |
        | **SL-M** | Stop-loss that executes as market order |
        """)

    with st.expander("💰 Margin & Leverage"):
        st.markdown("""
        - Intraday: broker gives **4–5× leverage** (₹50K → ₹2.5L buying power)
        - Must close all positions before **3:30 PM**
        - Delivery: no leverage, hold overnight
        """)

    with st.expander("🧾 Costs & Taxes"):
        st.markdown("""
        - **STT**: 0.025% on sell (intraday)
        - **Brokerage**: ~₹20/order
        - **Intraday profits**: taxed at your income slab (up to 30%)
        """)
        bv = st.number_input("Buy value (₹)", value=100_000, step=5000)
        sv = st.number_input("Sell value (₹)", value=101_000, step=5000)
        costs = calculate_trade_costs(bv, sv)
        st.write(f"Total costs on this trade: **₹{costs['total']:,.2f}**")
        st.write(f"Net profit after costs: **₹{sv - bv - costs['total']:,.2f}**")

    with st.expander("📖 Books to read"):
        st.markdown("""
        - **Trading in the Zone** — Mark Douglas (psychology)
        - **How to Make Money in Stocks** — William O'Neil (stock selection)
        """)

    if st.button("✅ Mark Phase 1 complete → go to Phase 2"):
        st.session_state.current_phase = 2
        st.success("Phase 1 done! Now go to Paper Trade.")


# ── Risk Calculator ──────────────────────────────────────────────────────────
elif page == "🧮 Risk Calculator":
    st.title("Intraday Risk Manager")
    st.markdown("Strict **1% risk per trade** — never risk more than this.")

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        capital = st.number_input("Total Capital (₹)", value=50_000.0, step=1000.0)
    with col2:
        risk_pct = st.number_input("Risk %", value=1.0, min_value=0.5, max_value=3.0, step=0.5)
    with col3:
        entry_price = st.number_input("Entry Price (₹)", value=150.0)
    with col4:
        stop_loss = st.number_input("Stop Loss (₹)", value=147.0)

    result = calculate_position(capital, entry_price, stop_loss, risk_pct)

    if not result.valid:
        st.error(result.error or "Invalid inputs.")
    else:
        c1, c2, c3 = st.columns(3)
        c1.success(f"**Max Risk:** ₹{result.max_risk_amount:,.2f}")
        c2.info(f"**Buy:** {result.shares_to_buy} shares")
        c3.metric("Trade Value", f"₹{result.total_trade_value:,.2f}")

        if result.margin_required:
            st.warning(
                f"Trade value ₹{result.total_trade_value:,.2f} exceeds capital. "
                f"Intraday margin (~5×) may be needed."
            )

        st.markdown(f"""
        | Detail | Value |
        |--------|-------|
        | Risk per share | ₹{result.risk_per_share} |
        | Max loss if SL hit | ₹{result.max_risk_amount:,.2f} |
        | Target (2:1 R:R) | ₹{entry_price + 2 * result.risk_per_share:.2f} |
        """)


# ── Screener ─────────────────────────────────────────────────────────────────
elif page == "📊 Screener":
    st.title("Intraday Stock Screener")
    st.caption("Stocks ranked by volume and momentum — use in Phase 1 to observe, Phase 2 to pick trades.")

    symbols = list(NSE_SCRIPS.keys())
    selected = st.multiselect("Stocks to scan", symbols, default=symbols[:8])

    if st.button("Refresh prices"):
        with st.spinner("Fetching live prices..."):
            quotes = []
            if st.session_state.broker_connected and st.session_state.broker_client:
                raw = fetch_quotes(st.session_state.broker_client, selected)
                for item in raw:
                    quotes.append({
                        "symbol": item.get("Symbol", ""),
                        "name": item.get("Name", ""),
                        "price": item.get("LastRate", 0),
                        "change_pct": item.get("ChgPcnt", 0),
                        "volume": item.get("TotalQty", 0),
                        "source": "5paisa",
                    })
            if not quotes:
                quotes = fetch_yahoo_quotes(selected)

            for q in quotes:
                q["score"] = score_stock(q)
            quotes.sort(key=lambda x: x["score"], reverse=True)
            st.session_state.screener_data = quotes

    if "screener_data" in st.session_state and st.session_state.screener_data:
        df = pd.DataFrame(st.session_state.screener_data)
        st.dataframe(
            df[["symbol", "name", "price", "change_pct", "volume", "score", "source"]],
            use_container_width=True,
            hide_index=True,
        )
    else:
        st.info("Click **Refresh prices** to load stock data.")


# ── Paper Trade ────────────────────────────────────────────────────────────────
elif page == "📝 Paper Trade":
    st.title("Phase 2: Paper Trade")
    st.markdown(f"Virtual capital: **₹{st.session_state.paper_cash:,.0f}** · Practice with fake money.")

    paper_stats = compute_stats(st.session_state.journal, paper=True)
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Sessions", f"{paper_stats['sessions']}/30")
    c2.metric("Win Rate", f"{paper_stats['win_rate']}%")
    c3.metric("Expectancy", f"₹{paper_stats['expectancy']}")
    c4.metric("Total P&L", f"₹{paper_stats['total_pnl']:,.0f}")

    st.divider()
    st.subheader("Place Paper Trade")

    with st.form("paper_trade"):
        fc1, fc2, fc3 = st.columns(3)
        with fc1:
            symbol = st.selectbox("Symbol", list(NSE_SCRIPS.keys()))
            qty = st.number_input("Quantity", min_value=1, value=1)
        with fc2:
            entry = st.number_input("Entry price (₹)", min_value=0.01, value=100.0)
            sl = st.number_input("Stop-loss (₹)", min_value=0.01, value=97.0)
        with fc3:
            strategy = st.selectbox("Strategy", STRATEGIES)
            emotion = st.selectbox("Emotion", EMOTIONS)
        reason = st.text_area("Why are you entering?", placeholder="ORB breakout above opening range with 2× volume")
        submitted = st.form_submit_button("Buy (Paper)")

    if submitted:
        if entry <= sl:
            st.error("Stop-loss must be below entry price.")
        elif not reason.strip():
            st.error("Write your entry reason.")
        else:
            cost = entry * qty + 40
            if cost > st.session_state.paper_cash:
                st.error(f"Not enough paper cash. Need ₹{cost:,.0f}, have ₹{st.session_state.paper_cash:,.0f}")
            else:
                st.session_state.paper_cash -= cost
                add_trade({
                    "id": str(uuid.uuid4())[:8],
                    "symbol": symbol,
                    "name": NSE_SCRIPS[symbol]["name"],
                    "quantity": qty,
                    "entry_price": entry,
                    "stop_loss": sl,
                    "strategy": strategy,
                    "emotion": emotion,
                    "entry_reason": reason,
                    "status": "OPEN",
                    "is_paper": True,
                    "session_date": str(date.today()),
                    "costs": 40,
                })
                st.success(f"Paper buy: {qty} × {symbol} @ ₹{entry}")
                st.rerun()

    # Close open trades
    open_trades = [t for t in st.session_state.journal if t["is_paper"] and t["status"] == "OPEN"]
    if open_trades:
        st.subheader("Open paper trades")
        for t in open_trades:
            with st.expander(f"{t['symbol']} · {t['quantity']} shares @ ₹{t['entry_price']}"):
                exit_p = st.number_input("Exit price", key=f"exit_{t['id']}", value=float(t["entry_price"]))
                exit_r = st.text_input("Exit reason", key=f"reason_{t['id']}")
                if st.button("Close trade", key=f"close_{t['id']}"):
                    close_trade(t["id"], exit_p, exit_r)
                    st.rerun()

    closed = [t for t in st.session_state.journal if t["is_paper"]]
    if closed:
        st.subheader("Journal")
        st.dataframe(pd.DataFrame(closed), use_container_width=True, hide_index=True)

    if paper_stats["sessions"] >= 30 and paper_stats["expectancy"] > 0:
        st.success("🎉 30+ sessions with positive expectancy! Ready for Phase 3.")
        if st.button("Start Phase 3: Live Trade"):
            st.session_state.current_phase = 3
            st.rerun()


# ── Live Trade ───────────────────────────────────────────────────────────────
elif page == "💰 Live Trade":
    st.title("Phase 3: Go Live Small")
    st.warning("Real money mode. Start with ₹25,000–50,000. Risk only 1% per trade.")

    st.session_state.live_capital = st.number_input(
        "Live capital (₹)", value=float(st.session_state.live_capital), step=5000.0
    )

    live_stats = compute_stats(st.session_state.journal, paper=False)
    c1, c2, c3 = st.columns(3)
    c1.metric("Live trades", live_stats["trades"])
    c2.metric("Win rate", f"{live_stats['win_rate']}%")
    c3.metric("P&L", f"₹{live_stats['total_pnl']:,.0f}")

    if not st.session_state.broker_connected:
        st.error("Connect to 5paisa first (sidebar → 5paisa Connect) before placing live orders.")
    else:
        st.subheader("Place Live Order via 5paisa")
        with st.form("live_order"):
            lc1, lc2, lc3 = st.columns(3)
            with lc1:
                lsymbol = st.selectbox("Symbol", list(NSE_SCRIPS.keys()))
                lqty = st.number_input("Quantity", min_value=1, value=1, key="lqty")
            with lc2:
                lentry = st.number_input("Limit price (₹)", min_value=0.01, value=100.0, key="lentry")
                lsl = st.number_input("Stop-loss (₹)", min_value=0.01, value=97.0, key="lsl")
            with lc3:
                lstrat = st.selectbox("Strategy", STRATEGIES, key="lstrat")
                lemo = st.selectbox("Emotion", EMOTIONS, key="lemo")
            lreason = st.text_area("Entry reason", key="lreason")
            confirm = st.checkbox("I confirm this is a live order with real money")
            live_submit = st.form_submit_button("Place Buy Order (5paisa)")

        if live_submit:
            if not confirm:
                st.error("Check the confirmation box.")
            else:
                from broker import place_order
                ok, msg = place_order(
                    st.session_state.broker_client, lsymbol, lqty, lentry, "B", True
                )
                if ok:
                    add_trade({
                        "id": str(uuid.uuid4())[:8],
                        "symbol": lsymbol,
                        "name": NSE_SCRIPS[lsymbol]["name"],
                        "quantity": lqty,
                        "entry_price": lentry,
                        "stop_loss": lsl,
                        "strategy": lstrat,
                        "emotion": lemo,
                        "entry_reason": lreason,
                        "status": "OPEN",
                        "is_paper": False,
                        "session_date": str(date.today()),
                        "costs": 40,
                        "broker_response": msg,
                    })
                    st.success(f"Order placed! {msg}")
                else:
                    st.error(msg)

    # Log live trade manually (without broker)
    st.subheader("Or log a live trade manually")
    with st.form("manual_live"):
        mc1, mc2 = st.columns(2)
        with mc1:
            msym = st.selectbox("Symbol", list(NSE_SCRIPS.keys()), key="msym")
            mqty = st.number_input("Qty", min_value=1, value=1, key="mqty")
            mentry = st.number_input("Entry", min_value=0.01, value=100.0, key="mentry")
        with mc2:
            msl = st.number_input("SL", min_value=0.01, value=97.0, key="msl")
            mstrat = st.selectbox("Strategy", STRATEGIES, key="mstrat")
            memo = st.selectbox("Emotion", EMOTIONS, key="memo")
        mreason = st.text_input("Reason", key="mreason")
        if st.form_submit_button("Log live trade"):
            add_trade({
                "id": str(uuid.uuid4())[:8],
                "symbol": msym, "name": NSE_SCRIPS[msym]["name"],
                "quantity": mqty, "entry_price": mentry, "stop_loss": msl,
                "strategy": mstrat, "emotion": memo, "entry_reason": mreason,
                "status": "OPEN", "is_paper": False,
                "session_date": str(date.today()), "costs": 40,
            })
            st.success("Live trade logged.")
            st.rerun()


# ── Scale ────────────────────────────────────────────────────────────────────
elif page == "📈 Scale":
    st.title("Phase 4: Scale")
    st.markdown("Only scale after **3 consecutive profitable months**.")

    live_trades = [t for t in st.session_state.journal if not t["is_paper"] and t["status"] == "CLOSED"]
    if live_trades:
        df = pd.DataFrame(live_trades)
        df["month"] = pd.to_datetime(df["session_date"]).dt.to_period("M").astype(str)
        monthly = df.groupby("month")["pnl"].sum().reset_index()
        st.dataframe(monthly, use_container_width=True, hide_index=True)

        profitable_months = (monthly["pnl"] > 0).sum()
        st.metric("Profitable months", profitable_months)
        if profitable_months >= 3:
            st.success("Ready to scale! Increase position size by max 25% per month.")
        else:
            st.warning(f"Need {3 - profitable_months} more profitable month(s).")
    else:
        st.info("No live trades yet. Complete Phase 3 first.")

    st.markdown("""
    **Scaling rules:**
    - Increase size by max 25% per month
    - If a month is negative, cut size by 50%
    - Never add capital to recover losses
  """)


# ── 5paisa Connect ───────────────────────────────────────────────────────────
elif page == "🔌 5paisa Connect":
    st.title("5paisa Broker Connection")
    st.markdown("Connect your 5paisa account for live prices and order placement.")

    if not credentials_configured():
        st.warning(
            "API keys not configured. Copy `.env.example` to `.env` and add your keys from "
            "[xstream.5paisa.com](https://xstream.5paisa.com)."
        )
        st.code("""
APP_NAME=your_app_name
APP_SOURCE=your_app_source
USER_ID=your_user_id
PASSWORD=your_password
USER_KEY=your_user_key
ENCRYPTION_KEY=your_encryption_key
        """)
    else:
        st.success("API credentials found in .env")

    tab1, tab2 = st.tabs(["OAuth Login", "TOTP Login"])

    with tab1:
        st.markdown("**Step 1:** Open this URL and log in with your 5paisa account:")
        st.code(oauth_login_url())
        st.markdown("**Step 2:** After login, copy the `RequestToken` from the redirect URL.")
        st.markdown("**Step 3:** Paste it below within 60 seconds.")

        token = st.text_input("Request Token", type="password")
        if st.button("Connect with OAuth"):
            if not token:
                st.error("Paste your Request Token.")
            else:
                try:
                    client = create_client()
                    ok, msg = login_oauth(client, token)
                    if ok:
                        st.session_state.broker_client = client
                        st.session_state.broker_connected = True
                        st.success(msg)
                    else:
                        st.error(msg)
                except Exception as e:
                    st.error(f"Connection error: {e}")

    with tab2:
        st.markdown("Requires `CLIENT_ID`, `PIN`, and `TOTP_SECRET` in your `.env` file.")
        if st.button("Connect with TOTP"):
            try:
                client = create_client()
                ok, msg = login_totp(client)
                if ok:
                    st.session_state.broker_client = client
                    st.session_state.broker_connected = True
                    st.success(msg)
                else:
                    st.error(msg)
            except Exception as e:
                st.error(f"TOTP error: {e}")

    if st.session_state.broker_connected:
        st.divider()
        st.subheader("Test market feed")
        test_sym = st.selectbox("Test symbol", list(NSE_SCRIPS.keys()))
        if st.button("Fetch live price"):
            quotes = fetch_quotes(st.session_state.broker_client, [test_sym])
            if quotes:
                st.json(quotes[0])
            else:
                st.warning("No data returned. Using Yahoo fallback:")
                st.json(fetch_yahoo_quotes([test_sym]))

        if st.button("Disconnect"):
            st.session_state.broker_client = None
            st.session_state.broker_connected = False
            st.rerun()

# ── Footer ───────────────────────────────────────────────────────────────────
st.sidebar.divider()
st.sidebar.caption("⚠️ Not financial advice. Trade at your own risk.")
