"""
Risk Manager — Layer 3: Position sizing with fixed fractional risk.

Ensures maximum loss per trade does not exceed a configurable percentage
of total capital (default 1%).
"""

from __future__ import annotations

from dataclasses import dataclass


DEFAULT_RISK_PCT = 0.01


@dataclass
class PositionSizeResult:
    shares: int
    position_value: float
    risk_amount: float
    risk_per_share: float
    risk_pct: float
    is_valid: bool
    message: str


def calculate_position_size(
    total_capital: float,
    entry_price: float,
    stop_loss: float,
    risk_pct: float = DEFAULT_RISK_PCT,
) -> PositionSizeResult:
    """Calculate shares so max loss <= risk_pct * total_capital."""
    if total_capital <= 0:
        return PositionSizeResult(
            0, 0.0, 0.0, 0.0, risk_pct, False, "Total capital must be greater than zero."
        )

    if entry_price <= 0:
        return PositionSizeResult(
            0, 0.0, 0.0, 0.0, risk_pct, False, "Entry price must be greater than zero."
        )

    if stop_loss >= entry_price:
        return PositionSizeResult(
            0, 0.0, 0.0, 0.0, risk_pct, False,
            "Stop loss must be below entry price for a long position.",
        )

    risk_per_share = entry_price - stop_loss
    risk_amount = total_capital * risk_pct
    shares = int(risk_amount // risk_per_share)

    if shares <= 0:
        return PositionSizeResult(
            0, 0.0, risk_amount, risk_per_share, risk_pct, False,
            "Risk per share exceeds allowed risk budget — increase capital or widen stop.",
        )

    position_value = shares * entry_price
    actual_risk = shares * risk_per_share

    return PositionSizeResult(
        shares=shares,
        position_value=round(position_value, 2),
        risk_amount=round(actual_risk, 2),
        risk_per_share=round(risk_per_share, 2),
        risk_pct=risk_pct,
        is_valid=True,
        message=(
            f"Buy {shares} shares. Max loss capped at {actual_risk:.2f} "
            f"({risk_pct * 100:.1f}% of capital)."
        ),
    )
