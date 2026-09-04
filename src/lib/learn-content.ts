export interface LearnModule {
  id: string;
  title: string;
  description: string;
  items: LearnItem[];
}

export interface LearnItem {
  id: string;
  title: string;
  content: string;
  example?: string;
}

export const LEARN_MODULES: LearnModule[] = [
  {
    id: "order-types",
    title: "Order Types",
    description: "How to place and manage orders on NSE/BSE via your broker.",
    items: [
      {
        id: "market",
        title: "Market Order",
        content:
          "Executes immediately at the best available price. Use when speed matters more than exact price. Risk: slippage in fast-moving stocks.",
        example: "Buy 10 RELIANCE at market → fills at ₹2,450.20 instead of quoted ₹2,449.50",
      },
      {
        id: "limit",
        title: "Limit Order",
        content:
          "Executes only at your specified price or better. Use for precise entries. Risk: order may not fill if price moves away.",
        example: "Buy RELIANCE limit ₹2,440 → only fills if price drops to ₹2,440 or below",
      },
      {
        id: "sl",
        title: "Stop-Loss (SL)",
        content:
          "Triggers a sell when price hits your loss limit. ALWAYS use this on every trade. Without SL, one bad trade can wipe your account.",
        example: "Buy at ₹100, SL at ₹98 → auto-sells if price drops to ₹98, limiting loss to ₹2/share",
      },
      {
        id: "slm",
        title: "Stop-Loss Market (SL-M)",
        content:
          "Like SL but executes as market order once triggered. Fills faster but may slip in volatile moves.",
        example: "SL-M at ₹98 → when hit, sells at whatever market price is available",
      },
      {
        id: "cover",
        title: "Cover Order (CO)",
        content:
          "Intraday order with mandatory stop-loss built in. Broker provides extra margin. SL cannot be removed until position is closed.",
      },
      {
        id: "bracket",
        title: "Bracket Order (BO)",
        content:
          "Intraday order with both stop-loss AND target built in. Auto-exits at either level. Good for disciplined trading.",
      },
    ],
  },
  {
    id: "margin",
    title: "Margin & Leverage",
    description: "How brokers lend you buying power for intraday trading.",
    items: [
      {
        id: "what-is-margin",
        title: "What is Margin?",
        content:
          "For intraday, brokers lend 4–5× your capital. With ₹1 lakh, you can buy up to ₹4–5 lakh worth of stocks — but must close before 3:30 PM.",
        example: "Capital ₹50,000 × 5× leverage = ₹2,50,000 buying power for intraday",
      },
      {
        id: "margin-call",
        title: "Margin Call & Auto Square-Off",
        content:
          "If losses exceed your margin, broker force-closes positions. Also auto-squares all intraday positions at 3:20–3:25 PM.",
      },
      {
        id: "delivery-margin",
        title: "Delivery (No Leverage)",
        content:
          "Delivery trades use 1× — you pay full amount. No forced square-off. Shares go to your demat account.",
      },
    ],
  },
  {
    id: "costs",
    title: "Trading Costs",
    description: "Every trade has hidden friction that eats your profits.",
    items: [
      {
        id: "brokerage",
        title: "Brokerage",
        content: "₹0–20 per order on flat-fee brokers (Zerodha, Groww). Charged on both buy and sell.",
      },
      {
        id: "stt",
        title: "STT (Securities Transaction Tax)",
        content: "0.025% on sell side for intraday. 0.1% on sell for delivery. Government tax — unavoidable.",
        example: "Sell ₹1,00,000 intraday → STT = ₹25",
      },
      {
        id: "other-charges",
        title: "Exchange, SEBI, GST, Stamp Duty",
        content: "Combined ~0.05% of turnover. Small per trade but adds up over 100+ trades/month.",
      },
      {
        id: "cost-impact",
        title: "Why Costs Matter",
        content:
          "On a ₹1L round trip, total costs ≈ ₹300–500. If your average profit is ₹500/trade, costs eat 60–100% of gains. You need trades with enough edge to overcome this.",
      },
    ],
  },
  {
    id: "taxes",
    title: "Taxes on Trading Profits",
    description: "How the Indian government taxes your trading income.",
    items: [
      {
        id: "speculative",
        title: "Intraday (Speculative Income)",
        content: "Taxed at your income slab rate — up to 30% + cess. No special rate. Report as business income.",
      },
      {
        id: "stcg",
        title: "Short-Term Capital Gains (Delivery < 1 year)",
        content: "20% flat rate on profits from stocks held less than 12 months.",
      },
      {
        id: "ltcg",
        title: "Long-Term Capital Gains (Delivery > 1 year)",
        content: "12.5% on gains above ₹1.25 lakh per year. First ₹1.25L is tax-free.",
      },
      {
        id: "loss-setoff",
        title: "Loss Set-Off",
        content:
          "Intraday losses can offset intraday gains in same year. Delivery STCL can offset STCG. Cannot offset salary income with trading losses (except if trading is your business).",
      },
    ],
  },
  {
    id: "books",
    title: "Recommended Reading",
    description: "Two essential books for your Phase 1 learning.",
    items: [
      {
        id: "trading-zone",
        title: "Trading in the Zone — Mark Douglas",
        content:
          "The psychology bible for traders. Key lessons: (1) Accept that any trade can lose. (2) Think in probabilities, not certainties. (3) Your edge plays out over 20+ trades, not one. (4) Fear and greed destroy discipline. Read this BEFORE placing your first paper trade.",
      },
      {
        id: "oneil",
        title: "How to Make Money in Stocks — William O'Neil",
        content:
          "CAN SLIM methodology for stock selection. Key lessons: (1) Buy stocks making new highs with volume. (2) Cut losses at 7–8%. (3) Let winners run. (4) Market direction matters — don't fight the trend. (5) Earnings growth drives stock prices. Use alongside the screener to find candidates.",
      },
    ],
  },
  {
    id: "screener-usage",
    title: "Using the Screener",
    description: "How to observe market behavior during Phase 1.",
    items: [
      {
        id: "observe",
        title: "Observe, Don't Trade",
        content:
          "During Phase 1, open the Screener tab daily at 9:30 AM and 2:00 PM. Note which stocks rank highest and WHY — is it volume? A gap? Sector news? Build pattern recognition without risking money.",
      },
      {
        id: "journal-observations",
        title: "Keep an Observation Log",
        content:
          "Write down: 'SBIN ranked #1 at 10 AM because RBI rate decision caused 2× volume and 2.5% move.' This builds the intuition you'll need for Phase 2 paper trading.",
      },
      {
        id: "patterns",
        title: "Patterns to Watch For",
        content:
          "Gap-up + high volume + holding above open = continuation likely. Gap-up + fading volume + falling below open = gap fade setup. High volume at day high = institutional buying.",
      },
    ],
  },
];

export const PHASE_REQUIREMENTS = {
  1: { title: "Learn", target: "Complete all learning modules", targetCount: 6 },
  2: { title: "Paper Trade", target: "30+ trading sessions with positive expectancy", targetCount: 30 },
  3: { title: "Go Live Small", target: "Trade with ₹25K–50K, 1% risk per trade", targetCount: 1 },
  4: { title: "Scale", target: "3 consecutive profitable months", targetCount: 3 },
} as const;
