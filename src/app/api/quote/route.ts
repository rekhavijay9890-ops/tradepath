import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");
  if (!symbol) {
    return NextResponse.json({ error: "symbol required" }, { status: 400 });
  }

  const yahooSymbol = symbol.includes(".") ? symbol : `${symbol}.NS`;

  try {
    const q = await yahooFinance.quote(yahooSymbol);
    return NextResponse.json({
      symbol: symbol.replace(".NS", "").replace(".BO", ""),
      name: q.shortName ?? q.longName ?? symbol,
      price: q.regularMarketPrice ?? 0,
      change: q.regularMarketChange ?? 0,
      changePercent: q.regularMarketChangePercent ?? 0,
      high: q.regularMarketDayHigh ?? 0,
      low: q.regularMarketDayLow ?? 0,
      open: q.regularMarketOpen ?? 0,
      previousClose: q.regularMarketPreviousClose ?? 0,
      volume: q.regularMarketVolume ?? 0,
    });
  } catch {
    return NextResponse.json({ error: "Could not fetch quote" }, { status: 404 });
  }
}
