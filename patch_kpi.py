#!/usr/bin/env python3
"""
Fix KPI dashboard colors on GitHub app.py (run in Codespace).

    python3 patch_kpi.py
    cp app.py streamlit_app/app.py
    git add app.py streamlit_app/app.py
    git commit -m "Fix KPI dashboard colors"
    git push origin main
"""
from __future__ import annotations

import re
from pathlib import Path

HELPERS = '''

def _return_color(value: float) -> str:
    if value > 0:
        return "#16a34a"
    if value < 0:
        return "#dc2626"
    return "#0f172a"


def _kpi_card(label: str, value: str, value_color: str = "#0f172a") -> None:
    import streamlit as st
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
    import streamlit as st
    cols = st.columns(len(items))
    for col, (label, value, color) in zip(cols, items):
        with col:
            _kpi_card(label, value, color)
'''

SCREENER_OLD = '''        c1, c2, c3, c4 = st.columns(4)
        c1.metric("Fresh Buy", fresh)
        c2.metric("Exit", exit_n)
        c3.metric("In Range", len(sdf))
        c4.metric("Scanned", len(NIFTY_SYMBOLS))'''

SCREENER_NEW = '''        _kpi_row([
            ("Fresh Buy", str(fresh), "#16a34a"),
            ("Exit", str(exit_n), "#dc2626"),
            ("In Range", str(len(sdf)), "#0f172a"),
            ("Scanned", str(len(NIFTY_SYMBOLS)), "#0f172a"),
        ])'''

BACKTEST_OLD = '''        k1, k2, k3, k4 = st.columns(4)
        k1.metric("Strategy Return", f"{bt.strategy_return_pct:+.2f}%")
        k2.metric("Buy & Hold Return", f"{bt.market_return_pct:+.2f}%")
        k3.metric("Win Rate", f"{bt.win_rate_pct:.1f}%")
        k4.metric("Max Drawdown", f"{bt.max_drawdown_pct:.2f}%")'''

BACKTEST_NEW = '''        _kpi_row([
            ("Strategy Return", f"{bt.strategy_return_pct:+.2f}%", _return_color(bt.strategy_return_pct)),
            ("Buy & Hold Return", f"{bt.market_return_pct:+.2f}%", _return_color(bt.market_return_pct)),
            ("Win Rate", f"{bt.win_rate_pct:.1f}%", "#2563eb"),
            ("Max Drawdown", f"{bt.max_drawdown_pct:.2f}%", "#dc2626"),
        ])'''


def patch_file(path: Path) -> bool:
    text = path.read_text()
    if "_kpi_card" in text:
        print(f"Skip {path} (already patched)")
        return False

    marker = "from strategy_engine import SIGNAL_BUY, SIGNAL_SELL, apply_strategy, classify_latest_signal"
    if marker not in text:
        raise SystemExit(f"Cannot patch {path}: import marker not found")

    text = text.replace(marker, marker + HELPERS)
    text = re.sub(
        r'\n    div\[data-testid="stMetric"\] \{.*?\n    \}\n',
        "\n",
        text,
        flags=re.DOTALL,
    )

    if SCREENER_OLD not in text:
        raise SystemExit(f"Cannot patch {path}: screener block not found")
    text = text.replace(SCREENER_OLD, SCREENER_NEW)

    if BACKTEST_OLD not in text:
        raise SystemExit(f"Cannot patch {path}: backtest block not found")
    text = text.replace(BACKTEST_OLD, BACKTEST_NEW)

    path.write_text(text)
    print(f"Patched {path}")
    return True


def main() -> None:
    changed = False
    for rel in ("app.py", "streamlit_app/app.py"):
        p = Path(rel)
        if p.exists():
            changed |= patch_file(p)
    if not changed:
        print("Nothing to patch.")
    else:
        print("Done. Run: git add app.py streamlit_app/app.py && git commit -m 'Fix KPI' && git push origin main")


if __name__ == "__main__":
    main()
