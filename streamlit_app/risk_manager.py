"""
Risk Manager — Layer 3: Fixed 1% fractional position sizing.
"""

from __future__ import annotations

RISK_FRACTION = 0.01


def calculate_position_size(
    capital: float,
    entry_price: float,
    stop_loss: float,
) -> int:
    """
    Return the number of shares to buy so max loss <= 1% of capital.

    Formula
    -------
    risk_budget    = capital * 0.01
    risk_per_share = entry_price - stop_loss
    shares         = floor(risk_budget / risk_per_share)

    Parameters
    ----------
    capital : float
        Total trading capital (₹).
    entry_price : float
        Planned entry price per share.
    stop_loss : float
        Stop-loss price (must be below entry for a long).

    Returns
    -------
    int
        Shares to buy.  Returns 0 when inputs are invalid.
    """
    if capital <= 0 or entry_price <= 0:
        return 0
    if stop_loss >= entry_price:
        return 0

    risk_per_share = entry_price - stop_loss
    if risk_per_share <= 0:
        return 0

    risk_budget = capital * RISK_FRACTION
    return int(risk_budget // risk_per_share)
