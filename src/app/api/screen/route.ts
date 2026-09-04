import { NextRequest, NextResponse } from "next/server";
import { fetchQuotes, getMarketStatus } from "@/lib/market-data";
import { rankPicks, scoreStock } from "@/lib/scoring";
import type { IndexUniverse, ScreenerFilters, ScreenerResponse, Signal } from "@/lib/types";
import { getUniverse } from "@/lib/universe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DISCLAIMER =
  "This tool is for educational screening only — not investment advice. Past patterns do not guarantee future returns. Intraday trading carries high risk of loss. Consult a SEBI-registered advisor before trading.";

function parseIndex(value: string | null): IndexUniverse {
  if (value === "NIFTY100" || value === "BANKNIFTY") return value;
  return "NIFTY50";
}

function parseSignal(value: string | null): Signal | undefined {
  const valid: Signal[] = ["STRONG_BUY", "BUY", "WATCH", "SELL", "AVOID"];
  return valid.includes(value as Signal) ? (value as Signal) : undefined;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const filters: ScreenerFilters = {
    index: parseIndex(searchParams.get("index")),
    minScore: Math.max(0, Math.min(100, Number(searchParams.get("minScore") ?? 50))),
    signal: parseSignal(searchParams.get("signal")),
    minVolume: Math.max(0, Number(searchParams.get("minVolume") ?? 500_000)),
  };

  const universe = getUniverse(filters.index);
  const { quotes, dataSource } = await fetchQuotes(universe);

  let picks = rankPicks(quotes.map(scoreStock));

  picks = picks.filter(
    (p) => p.score >= filters.minScore && p.quote.volume >= filters.minVolume
  );

  if (filters.signal) {
    picks = picks.filter((p) => p.signal === filters.signal);
  }

  const response: ScreenerResponse = {
    picks: picks.slice(0, 25),
    scannedAt: new Date().toISOString(),
    marketStatus: getMarketStatus(),
    dataSource,
    disclaimer: DISCLAIMER,
  };

  return NextResponse.json(response);
}
