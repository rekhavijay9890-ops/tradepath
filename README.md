# Quantitative Stock Analytics & Screener

A modular Python application for screening Nifty 50 stocks, sizing positions with fixed fractional risk, and backtesting an EMA/RSI strategy — built with **Streamlit**, **yfinance**, **pandas**, and **pandas-ta**.

## Architecture (4 Layers)

| Layer | Module | Responsibility |
|-------|--------|----------------|
| 1 | `data_engine.py` | Fetch OHLCV data via yfinance; normalize timezone-aware indices |
| 2 | `strategy_engine.py` | Compute EMA(20), EMA(50), RSI(14); generate Buy/Hold/Exit signals |
| 3 | `risk_manager.py` | 1% risk position sizing from capital, entry, and stop-loss |
| 4 | `backtest_engine.py` | Simulate strategy returns vs buy-and-hold benchmark |

The Streamlit UI (`app.py`) orchestrates all layers.

## Strategy Rules

- **Buy:** 20 EMA > 50 EMA **and** RSI(14) > 50
- **Exit:** 20 EMA < 50 EMA **or** RSI(14) < 40
- **Hold:** Buy criteria still met on consecutive days
- **Fresh Buy:** Buy criteria met for the first time after a non-buy period

## Features

1. **Risk Calculator (Sidebar)** — Enter total capital, entry price, and stop loss to compute exact share count capped at 1% max loss.
2. **Live Market Screener (Tab 1)** — Scans 50 Nifty stocks with 6 months of daily data; highlights Fresh Buy, Hold, and Exit signals.
3. **Backtesting Engine (Tab 2)** — Select any Nifty 50 stock, run a 2-year backtest, and compare cumulative strategy vs buy-and-hold returns.

## Setup

```bash
pip install -r requirements.txt
```

## Run

```bash
streamlit run app.py --server.port 8741
```

Open the URL shown in the terminal (default: `http://localhost:8741`).

## Project Structure

```
app.py               # Streamlit dashboard and UI routing
data_engine.py       # yfinance data fetching
strategy_engine.py   # Technical indicators and signals
risk_manager.py      # 1% risk position sizing
backtest_engine.py   # Strategy backtesting
requirements.txt     # Python dependencies
```

## Notes

- Tickers use the NSE suffix (e.g. `RELIANCE.NS`). Data is sourced from Yahoo Finance via `yfinance`.
- Datetime indices are normalized to timezone-naive UTC for compatibility with Streamlit charts and pandas-ta.
- This tool is for educational and analytical purposes only — not financial advice.
