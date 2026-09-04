"""5paisa broker connection helpers."""

from __future__ import annotations

import os
from typing import Any

# Popular NSE stocks for screener / market feed
NSE_SCRIPS: dict[str, dict[str, str]] = {
    "RELIANCE": {"ScripData": "RELIANCE_EQ", "name": "Reliance Industries"},
    "TCS": {"ScripData": "TCS_EQ", "name": "Tata Consultancy Services"},
    "HDFCBANK": {"ScripData": "HDFCBANK_EQ", "name": "HDFC Bank"},
    "INFY": {"ScripData": "INFY_EQ", "name": "Infosys"},
    "ICICIBANK": {"ScripData": "ICICIBANK_EQ", "name": "ICICI Bank"},
    "SBIN": {"ScripData": "SBIN_EQ", "name": "State Bank of India"},
    "ITC": {"ScripData": "ITC_EQ", "name": "ITC"},
    "BHARTIARTL": {"ScripData": "BHARTIARTL_EQ", "name": "Bharti Airtel"},
    "LT": {"ScripData": "LT_EQ", "name": "Larsen & Toubro"},
    "AXISBANK": {"ScripData": "AXISBANK_EQ", "name": "Axis Bank"},
    "TATAMOTORS": {"ScripData": "TATAMOTORS_EQ", "name": "Tata Motors"},
    "WIPRO": {"ScripData": "WIPRO_EQ", "name": "Wipro"},
}


def get_credentials() -> dict[str, str]:
    return {
        "APP_NAME": os.getenv("APP_NAME", ""),
        "APP_SOURCE": os.getenv("APP_SOURCE", ""),
        "USER_ID": os.getenv("USER_ID", ""),
        "PASSWORD": os.getenv("PASSWORD", ""),
        "USER_KEY": os.getenv("USER_KEY", ""),
        "ENCRYPTION_KEY": os.getenv("ENCRYPTION_KEY", ""),
    }


def credentials_configured() -> bool:
    cred = get_credentials()
    return all(cred[k] and not cred[k].startswith("YOUR_") for k in cred)


def oauth_login_url() -> str:
    user_key = os.getenv("USER_KEY", "YOUR_USER_KEY")
    response_url = os.getenv("RESPONSE_URL", "https://www.5paisa.com/technology/developer-apis")
    return (
        f"https://dev-openapi.5paisa.com/WebVendorLogin/VLogin/Index"
        f"?VendorKey={user_key}&ResponseURL={response_url}"
    )


def create_client():
    from py5paisa import FivePaisaClient

    return FivePaisaClient(cred=get_credentials())


def login_oauth(client, request_token: str) -> tuple[bool, str]:
    try:
        client.get_oauth_session(request_token.strip())
        return True, "Successfully logged in to 5paisa!"
    except Exception as e:
        return False, f"OAuth login failed: {e}"


def login_totp(client) -> tuple[bool, str]:
    try:
        import pyotp

        secret = os.getenv("TOTP_SECRET", "")
        client_id = os.getenv("CLIENT_ID", "")
        pin = os.getenv("PIN", "")
        if not all([secret, client_id, pin]):
            return False, "Set CLIENT_ID, PIN, and TOTP_SECRET in .env for TOTP login."
        totp = pyotp.TOTP(secret)
        client.get_totp_session(client_id, totp.now(), pin)
        return True, "TOTP login successful!"
    except Exception as e:
        return False, f"TOTP login failed: {e}"


def fetch_quotes(client, symbols: list[str]) -> list[dict[str, Any]]:
    req_list = [
        {"Exch": "N", "ExchType": "C", "ScripData": NSE_SCRIPS[s]["ScripData"]}
        for s in symbols
        if s in NSE_SCRIPS
    ]
    if not req_list:
        return []
    try:
        data = client.fetch_market_feed_scrip(req_list)
        if isinstance(data, dict) and "Data" in data:
            return data["Data"]
        if isinstance(data, list):
            return data
        return []
    except Exception:
        return []


def place_order(
    client,
    symbol: str,
    qty: int,
    price: float,
    order_type: str = "B",
    is_intraday: bool = True,
) -> tuple[bool, str]:
    """Place a buy order. order_type: B=Buy, S=Sell. Use only in Phase 3 live trading."""
    if symbol not in NSE_SCRIPS:
        return False, f"Unknown symbol: {symbol}"
    try:
        order = client.place_order(
            OrderType=order_type,
            Exchange="N",
            ExchangeType="C",
            ScripData=NSE_SCRIPS[symbol]["ScripData"],
            Qty=qty,
            Price=price,
            IsIntraday=is_intraday,
        )
        return True, str(order)
    except Exception as e:
        return False, f"Order failed: {e}"
