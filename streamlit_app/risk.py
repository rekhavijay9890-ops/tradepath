"""Risk management and position sizing."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class PositionSize:
    capital: float
    risk_percent: float
    entry_price: float
    stop_loss: float
    max_risk_amount: float
    risk_per_share: float
    shares_to_buy: int
    total_trade_value: float
    margin_required: bool
    valid: bool
    error: str = ""


def calculate_position(
    capital: float,
    entry_price: float,
    stop_loss: float,
    risk_percent: float = 1.0,
    leverage: float = 5.0,
) -> PositionSize:
    if entry_price <= 0:
        return PositionSize(
            capital, risk_percent, entry_price, stop_loss,
            0, 0, 0, 0, False, False, "Entry price must be positive."
        )
    if entry_price <= stop_loss:
        return PositionSize(
            capital, risk_percent, entry_price, stop_loss,
            0, 0, 0, 0, False, False, "Stop-loss must be below entry price for a BUY."
        )

    max_risk = capital * (risk_percent / 100)
    risk_per_share = entry_price - stop_loss
    shares = int(max_risk / risk_per_share) if risk_per_share > 0 else 0
    trade_value = shares * entry_price
    margin_required = trade_value > capital

    return PositionSize(
        capital=capital,
        risk_percent=risk_percent,
        entry_price=entry_price,
        stop_loss=stop_loss,
        max_risk_amount=round(max_risk, 2),
        risk_per_share=round(risk_per_share, 2),
        shares_to_buy=shares,
        total_trade_value=round(trade_value, 2),
        margin_required=margin_required,
        valid=shares > 0,
    )


def calculate_trade_costs(buy_value: float, sell_value: float, intraday: bool = True) -> dict[str, float]:
    brokerage = 40.0
    stt = sell_value * (0.00025 if intraday else 0.001)
    exchange = (buy_value + sell_value) * 0.0000345
    sebi = (buy_value + sell_value) * 0.000001
    gst = (brokerage + exchange + sebi) * 0.18
    stamp = buy_value * 0.00003
    total = brokerage + stt + exchange + sebi + gst + stamp
    return {
        "brokerage": round(brokerage, 2),
        "stt": round(stt, 2),
        "exchange": round(exchange + sebi + gst, 2),
        "stamp_duty": round(stamp, 2),
        "total": round(total, 2),
    }
