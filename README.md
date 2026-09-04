# TradePath

A complete 4-phase trading education and practice app for India's NSE/BSE markets. Guides you from learning the basics to paper trading, live trading with small capital, and scaling — with an intraday stock screener built in.

**This is not financial advice.** Most retail intraday traders lose money. Use this app for structured learning and practice only.

## The 4-Phase Journey

| Phase | Goal | What the app provides |
|-------|------|----------------------|
| **1. Learn** | 2–4 weeks of fundamentals | Order types, margin, costs, taxes, book recommendations, calculators, learning checklist |
| **2. Paper Trade** | 30+ sessions, positive expectancy | Virtual ₹1L portfolio, trade journal (entry/exit/reason/emotion), expectancy analytics |
| **3. Go Live** | ₹25K–50K, 1% risk per trade | Live trade logging, position size calculator, strategy lock-in |
| **4. Scale** | 3 consecutive profitable months | Monthly P&L tracker, scaling rules, consecutive month counter |

## Features

- **Dashboard** — Phase progress across all 4 stages
- **Learning modules** — Interactive content on orders, margin, STT, taxes
- **Cost & tax calculator** — See how fees eat into profits
- **Paper trading** — Buy/sell with live NSE prices, virtual portfolio
- **Trade journal** — Track symbol, strategy, emotion, P&L per trade
- **Expectancy engine** — Win rate, avg win/loss, profit factor, per-trade expectancy
- **Intraday screener** — NIFTY 50/100/Bank NIFTY stock ranking by volume, volatility, momentum
- **Emotion insights** — See which emotions correlate with losses (REVENGE, FOMO)

## Quick start

```bash
npm install
npm run dev -- -p 4317
```

Open [http://localhost:4317](http://localhost:4317).

All data is stored in your browser (localStorage) — no account or database needed.

## API

```
GET /api/screen?index=NIFTY50&minScore=55&signal=BUY
GET /api/quote?symbol=RELIANCE
```

## How to use

1. Start on the **Dashboard** — see your phase progress
2. Complete **Phase 1: Learn** — read all modules, use calculators, observe the screener daily
3. Move to **Phase 2: Paper Trade** — place trades with virtual money, journal every trade
4. Only advance to **Phase 3: Live** when you have 30+ sessions AND positive expectancy
5. Log real trades in Phase 3 with strict 1% risk
6. Track monthly P&L in **Phase 4: Scale** — only increase size after 3 profitable months

## Disclaimer

This software is for educational purposes only. It does not constitute investment advice. Trading involves substantial risk of loss. Consult a SEBI-registered advisor before making financial decisions.

## License

MIT
