export type Signal = "STRONG_BUY" | "BUY" | "WATCH" | "SELL" | "AVOID";

export type IndexUniverse = "NIFTY50" | "NIFTY100" | "BANKNIFTY";

export interface StockQuote {
  symbol: string;
  name: string;
  exchange: "NSE" | "BSE";
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  volume: number;
  avgVolume: number;
  marketCap?: number;
}

export interface ScoreBreakdown {
  volume: number;
  volatility: number;
  momentum: number;
  rangePosition: number;
  liquidity: number;
}

export interface StockPick {
  quote: StockQuote;
  score: number;
  signal: Signal;
  breakdown: ScoreBreakdown;
  rationale: string[];
  intradayRange: number;
  gapPercent: number;
}

export interface ScreenerFilters {
  index: IndexUniverse;
  minScore: number;
  signal?: Signal;
  minVolume: number;
}

export interface ScreenerResponse {
  picks: StockPick[];
  scannedAt: string;
  marketStatus: "OPEN" | "CLOSED" | "PRE_OPEN" | "UNKNOWN";
  dataSource: "yahoo" | "demo";
  disclaimer: string;
}
