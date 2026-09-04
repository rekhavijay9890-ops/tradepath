# TradePath

A 4-phase intraday trading education app for India's NSE/BSE markets.

**Two versions available:**
- **Streamlit + 5paisa** (Python) — recommended if you have a 5paisa account
- **Next.js** (web) — browser-only, no broker needed

---

## Streamlit App (your 5paisa code)

### Setup

```bash
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your 5paisa API keys from https://xstream.5paisa.com
```

### Run

```bash
streamlit run streamlit_app/app.py --server.port 8742
```

Open **http://localhost:8742**

### Features

| Page | What it does |
|------|-------------|
| **Home** | Overview and progress |
| **Phase 1: Learn** | Order types, margin, costs, taxes |
| **Risk Calculator** | 1% risk position sizing (your original code, improved) |
| **Screener** | Live NSE stock prices (5paisa or Yahoo fallback) |
| **Paper Trade** | Practice with ₹1L virtual money + trade journal |
| **Live Trade** | Place real orders via 5paisa API |
| **Scale** | Monthly P&L tracker for scaling decisions |
| **5paisa Connect** | OAuth or TOTP broker login |

### 5paisa Login

1. Get API keys from [xstream.5paisa.com](https://xstream.5paisa.com)
2. Add them to `.env`
3. In the app → **5paisa Connect** → OAuth or TOTP login
4. OAuth: open the login URL, copy `RequestToken` from redirect URL, paste in app

> Note: Username/password login is deprecated by 5paisa. Use OAuth or TOTP.

---

## Next.js App (alternative)

```bash
npm install
npm run dev -- -p 4317
```

Open **http://localhost:4317**

---

## Disclaimer

Educational tool only. Not financial advice. Most retail intraday traders lose money.

## License

MIT
