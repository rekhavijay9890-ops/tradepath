import type { ScoreBreakdown, Signal, StockPick, StockQuote } from "./types";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function scoreVolume(quote: StockQuote): number {
  const volumeRatio = quote.avgVolume > 0 ? quote.volume / quote.avgVolume : 1;
  if (quote.volume < 500_000) return 5;
  if (volumeRatio >= 2) return 25;
  if (volumeRatio >= 1.5) return 22;
  if (volumeRatio >= 1.2) return 18;
  if (volumeRatio >= 1) return 14;
  return 8;
}

function scoreVolatility(quote: StockQuote): number {
  const range = quote.high - quote.low;
  const rangePct = quote.price > 0 ? (range / quote.price) * 100 : 0;
  // Intraday traders prefer 1.5%–4% daily range
  if (rangePct >= 1.5 && rangePct <= 4) return 25;
  if (rangePct >= 1 && rangePct <= 5) return 20;
  if (rangePct >= 0.5 && rangePct <= 6) return 12;
  if (rangePct > 6) return 8; // too volatile / risky
  return 5; // too flat
}

function scoreMomentum(quote: StockQuote): number {
  const absChange = Math.abs(quote.changePercent);
  if (absChange >= 1 && absChange <= 3.5) return 25;
  if (absChange >= 0.5 && absChange <= 5) return 18;
  if (absChange > 5) return 8; // extended move, reversal risk
  return 10;
}

function scoreRangePosition(quote: StockQuote): number {
  const range = quote.high - quote.low;
  if (range <= 0) return 10;
  const position = (quote.price - quote.low) / range;
  const isBullish = quote.changePercent >= 0;

  if (isBullish && position >= 0.7) return 25;
  if (isBullish && position >= 0.55) return 20;
  if (!isBullish && position <= 0.3) return 25;
  if (!isBullish && position <= 0.45) return 20;
  return 12;
}

function scoreLiquidity(quote: StockQuote): number {
  // Favor liquid, mid-to-large cap price bands common for retail intraday
  if (quote.price >= 100 && quote.price <= 5000 && quote.volume >= 1_000_000) return 20;
  if (quote.price >= 50 && quote.volume >= 500_000) return 15;
  if (quote.price < 20) return 3; // penny-stock risk
  return 10;
}

function deriveSignal(score: number, quote: StockQuote): Signal {
  const range = quote.high - quote.low;
  const position = range > 0 ? (quote.price - quote.low) / range : 0.5;
  const bullish = quote.changePercent >= 0;

  if (quote.volume < 300_000 || quote.price < 10) return "AVOID";

  if (score >= 78 && bullish && position >= 0.65) return "STRONG_BUY";
  if (score >= 65 && bullish) return "BUY";
  if (score >= 65 && !bullish && position <= 0.35) return "SELL";
  if (score >= 48) return "WATCH";
  return "AVOID";
}

function buildRationale(quote: StockQuote, breakdown: ScoreBreakdown): string[] {
  const notes: string[] = [];
  const rangePct = quote.price > 0 ? ((quote.high - quote.low) / quote.price) * 100 : 0;
  const volumeRatio = quote.avgVolume > 0 ? quote.volume / quote.avgVolume : 1;
  const gapPct =
    quote.previousClose > 0
      ? ((quote.open - quote.previousClose) / quote.previousClose) * 100
      : 0;

  if (volumeRatio >= 1.5) {
    notes.push(`Volume is ${volumeRatio.toFixed(1)}× average — good liquidity for intraday exits.`);
  } else if (volumeRatio < 0.8) {
    notes.push("Below-average volume — wider spreads and slippage risk.");
  }

  if (rangePct >= 1.5 && rangePct <= 4) {
    notes.push(`Day range of ${rangePct.toFixed(1)}% offers intraday movement without extreme volatility.`);
  }

  if (Math.abs(gapPct) >= 0.8) {
    notes.push(
      gapPct > 0
        ? `Gap-up open (+${gapPct.toFixed(1)}%) — watch for continuation or fade.`
        : `Gap-down open (${gapPct.toFixed(1)}%) — watch for breakdown or bounce.`
    );
  }

  if (quote.changePercent >= 1.5) {
    notes.push(`Up ${quote.changePercent.toFixed(1)}% — bullish momentum; consider buying dips near VWAP/support.`);
  } else if (quote.changePercent <= -1.5) {
    notes.push(`Down ${Math.abs(quote.changePercent).toFixed(1)}% — bearish momentum; short only if you have F&O access.`);
  }

  if (breakdown.liquidity < 8) {
    notes.push("Low liquidity band — avoid for intraday unless you accept execution risk.");
  }

  if (notes.length === 0) {
    notes.push("Moderate setup — wait for a clearer volume or price-action trigger.");
  }

  return notes;
}

export function scoreStock(quote: StockQuote): StockPick {
  const breakdown: ScoreBreakdown = {
    volume: scoreVolume(quote),
    volatility: scoreVolatility(quote),
    momentum: scoreMomentum(quote),
    rangePosition: scoreRangePosition(quote),
    liquidity: scoreLiquidity(quote),
  };

  const total =
    breakdown.volume +
    breakdown.volatility +
    breakdown.momentum +
    breakdown.rangePosition +
    breakdown.liquidity;

  const intradayRange = quote.price > 0 ? ((quote.high - quote.low) / quote.price) * 100 : 0;
  const gapPercent =
    quote.previousClose > 0
      ? ((quote.open - quote.previousClose) / quote.previousClose) * 100
      : 0;

  return {
    quote,
    score: Math.round(total),
    signal: deriveSignal(total, quote),
    breakdown,
    rationale: buildRationale(quote, breakdown),
    intradayRange: Math.round(intradayRange * 100) / 100,
    gapPercent: Math.round(gapPercent * 100) / 100,
  };
}

export function rankPicks(picks: StockPick[]): StockPick[] {
  return [...picks].sort((a, b) => b.score - a.score);
}
