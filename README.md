# IntradayPulse

An educational intraday stock screener for India's NSE and BSE markets. It ranks liquid stocks by volume, volatility, momentum, and range position to surface potential buy/sell setups for day trading.

**This is not financial advice.** Most retail intraday traders lose money. Use this tool for research and learning only.

## Features

- Screens NIFTY 50, NIFTY 100, and Bank NIFTY universes
- Scores each stock on 5 intraday factors (volume, volatility, momentum, range position, liquidity)
- Signals: Strong Buy, Buy, Watch, Sell, Avoid
- Live market data via Yahoo Finance (NSE `.NS` symbols)
- Auto-refresh every 60 seconds during use
- Built-in trading guide with Indian market context (STT, F&O rules, risk management)

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:4317](http://localhost:4317).

## API

```
GET /api/screen?index=NIFTY50&minScore=55&signal=BUY
```

| Parameter  | Values                                      | Default  |
|------------|---------------------------------------------|----------|
| `index`    | `NIFTY50`, `NIFTY100`, `BANKNIFTY`          | NIFTY50  |
| `minScore` | 0–100                                       | 50       |
| `signal`   | `STRONG_BUY`, `BUY`, `WATCH`, `SELL`, `AVOID` | (all)  |
| `minVolume`| number                                      | 500000   |

## How scoring works

| Factor          | What it measures                                      |
|-----------------|-------------------------------------------------------|
| Volume          | Today's volume vs 3-month average (liquidity)         |
| Volatility      | Day high–low range as % of price (1.5–4% ideal)       |
| Momentum        | % change from previous close (1–3.5% ideal)           |
| Range position  | Where price sits in today's range (trend continuation)|
| Liquidity       | Price band and absolute volume thresholds             |

## Can you make money intraday trading?

Honestly: **it's hard**. A screener finds stocks with movement and liquidity — it cannot predict direction. Profitable intraday trading typically requires:

1. Strict risk management (1–2% per trade, always stop-loss)
2. A tested strategy (opening range breakout, VWAP reclaim, etc.)
3. Discipline to avoid overtrading
4. Accounting for STT, brokerage, and taxes on gains

Paper trade before risking real capital.

## Roadmap

- [ ] Broker API integration (Zerodha Kite, Angel One)
- [ ] VWAP, RSI, and ORB technical filters
- [ ] NSE live data feed for real-time quotes
- [ ] Historical backtesting of the scoring model
- [ ] BSE-specific symbol support (`.BO`)

## Disclaimer

This software is provided for educational purposes only. It does not constitute investment advice, a recommendation, or a solicitation to buy or sell any securities. Trading in securities involves substantial risk of loss. Consult a SEBI-registered investment advisor before making financial decisions. The authors are not liable for any trading losses.

## License

MIT
