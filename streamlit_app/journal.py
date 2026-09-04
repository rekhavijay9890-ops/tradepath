"""Trade journal stored in Streamlit session state."""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path
from typing import Any

JOURNAL_FILE = Path(__file__).parent.parent / "data" / "journal.json"


def init_journal_state() -> None:
    import streamlit as st

    if "journal" not in st.session_state:
        st.session_state.journal = load_journal()
    if "paper_cash" not in st.session_state:
        st.session_state.paper_cash = 100_000.0
    if "paper_capital" not in st.session_state:
        st.session_state.paper_capital = 100_000.0
    if "live_capital" not in st.session_state:
        st.session_state.live_capital = 50_000.0
    if "current_phase" not in st.session_state:
        st.session_state.current_phase = 1
    if "broker_client" not in st.session_state:
        st.session_state.broker_client = None
    if "broker_connected" not in st.session_state:
        st.session_state.broker_connected = False


def load_journal() -> list[dict[str, Any]]:
    if JOURNAL_FILE.exists():
        try:
            return json.loads(JOURNAL_FILE.read_text())
        except Exception:
            return []
    return []


def save_journal(trades: list[dict[str, Any]]) -> None:
    JOURNAL_FILE.parent.mkdir(parents=True, exist_ok=True)
    JOURNAL_FILE.write_text(json.dumps(trades, indent=2, default=str))


def add_trade(trade: dict[str, Any]) -> None:
    import streamlit as st

    st.session_state.journal.insert(0, trade)
    save_journal(st.session_state.journal)


def close_trade(trade_id: str, exit_price: float, exit_reason: str) -> None:
    import streamlit as st

    for t in st.session_state.journal:
        if t["id"] == trade_id and t["status"] == "OPEN":
            gross = (exit_price - t["entry_price"]) * t["quantity"]
            costs = t.get("costs", 0) + 40  # rough exit costs
            pnl = round(gross - costs, 2)
            t.update({
                "exit_price": exit_price,
                "exit_reason": exit_reason,
                "status": "CLOSED",
                "pnl": pnl,
                "closed_at": str(date.today()),
            })
            if t["is_paper"]:
                st.session_state.paper_cash += exit_price * t["quantity"] - 40
            break
    save_journal(st.session_state.journal)


def compute_stats(trades: list[dict[str, Any]], paper: bool | None = None) -> dict[str, Any]:
    filtered = [t for t in trades if t["status"] == "CLOSED"]
    if paper is not None:
        filtered = [t for t in filtered if t["is_paper"] == paper]

    if not filtered:
        return {"win_rate": 0, "avg_win": 0, "avg_loss": 0, "expectancy": 0, "total_pnl": 0, "sessions": 0, "trades": 0}

    wins = [t for t in filtered if t.get("pnl", 0) > 0]
    losses = [t for t in filtered if t.get("pnl", 0) <= 0]
    win_rate = len(wins) / len(filtered) * 100
    avg_win = sum(t["pnl"] for t in wins) / len(wins) if wins else 0
    avg_loss = abs(sum(t["pnl"] for t in losses) / len(losses)) if losses else 0
    expectancy = (win_rate / 100) * avg_win - (1 - win_rate / 100) * avg_loss
    sessions = len({t["session_date"] for t in filtered})

    return {
        "win_rate": round(win_rate, 1),
        "avg_win": round(avg_win, 2),
        "avg_loss": round(avg_loss, 2),
        "expectancy": round(expectancy, 2),
        "total_pnl": round(sum(t.get("pnl", 0) for t in filtered), 2),
        "sessions": sessions,
        "trades": len(filtered),
    }
