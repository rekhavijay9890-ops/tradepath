import YahooFinance from "yahoo-finance2";
import type { StockQuote } from "./types";
import type { UniverseStock } from "./universe";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

interface YahooQuote {
  symbol?: string;
  shortName?: string;
  longName?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketOpen?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketPreviousClose?: number;
  regularMarketVolume?: number;
  averageDailyVolume3Month?: number;
  marketCap?: number;
}

function toStockQuote(stock: UniverseStock, raw: YahooQuote): StockQuote | null {
  const price = raw.regularMarketPrice;
  if (price == null || price <= 0) return null;

  return {
    symbol: stock.symbol,
    name: stock.name,
    exchange: "NSE",
    price,
    change: raw.regularMarketChange ?? 0,
    changePercent: raw.regularMarketChangePercent ?? 0,
    open: raw.regularMarketOpen ?? price,
    high: raw.regularMarketDayHigh ?? price,
    low: raw.regularMarketDayLow ?? price,
    previousClose: raw.regularMarketPreviousClose ?? price,
    volume: raw.regularMarketVolume ?? 0,
    avgVolume: raw.averageDailyVolume3Month ?? raw.regularMarketVolume ?? 0,
    marketCap: raw.marketCap,
  };
}

export async function fetchQuotes(stocks: UniverseStock[]): Promise<{
  quotes: StockQuote[];
  dataSource: "yahoo" | "demo";
}> {
  const symbols = stocks.map((s) => s.yahooSymbol);

  try {
    const results = (await yahooFinance.quote(symbols)) as YahooQuote | YahooQuote[];
    const list = Array.isArray(results) ? results : [results];

    const bySymbol = new Map<string, YahooQuote>();
    for (const item of list) {
      if (item.symbol) bySymbol.set(item.symbol, item);
    }

    const quotes: StockQuote[] = [];
    for (const stock of stocks) {
      const raw = bySymbol.get(stock.yahooSymbol);
      if (!raw) continue;
      const quote = toStockQuote(stock, raw);
      if (quote) quotes.push(quote);
    }

    if (quotes.length >= Math.min(5, stocks.length * 0.3)) {
      return { quotes, dataSource: "yahoo" };
    }
  } catch {
    // fall through to demo
  }

  return { quotes: generateDemoQuotes(stocks), dataSource: "demo" };
}

function generateDemoQuotes(stocks: UniverseStock[]): StockQuote[] {
  return stocks.map((stock, i) => {
    const base = 200 + (i * 137) % 2800;
    const changePct = ((i * 17) % 11 - 5) * 0.35;
    const price = base * (1 + changePct / 100);
    const prev = base;
    const open = prev * (1 + ((i % 5) - 2) * 0.003);
    const high = Math.max(price, open) * (1 + 0.008 + (i % 3) * 0.004);
    const low = Math.min(price, open) * (1 - 0.008 - (i % 4) * 0.003);
    const volume = 800_000 + (i * 91_000) % 4_000_000;
    const avgVolume = volume * (0.7 + (i % 5) * 0.1);

    return {
      symbol: stock.symbol,
      name: stock.name,
      exchange: "NSE" as const,
      price: Math.round(price * 100) / 100,
      change: Math.round((price - prev) * 100) / 100,
      changePercent: Math.round(changePct * 100) / 100,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      previousClose: Math.round(prev * 100) / 100,
      volume,
      avgVolume,
      marketCap: base * 1_000_000,
    };
  });
}

export function getMarketStatus(): "OPEN" | "CLOSED" | "PRE_OPEN" | "UNKNOWN" {
  const now = new Date();
  const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const day = ist.getDay();
  const minutes = ist.getHours() * 60 + ist.getMinutes();

  if (day === 0 || day === 6) return "CLOSED";
  if (minutes >= 555 && minutes < 555 + 15) return "PRE_OPEN"; // 9:15–9:30
  if (minutes >= 555 + 15 && minutes <= 930) return "OPEN"; // 9:30–15:30
  return "CLOSED";
}
