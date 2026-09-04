"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { IndexUniverse, ScreenerResponse, Signal, StockPick } from "@/lib/types";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const SIGNAL_STYLES: Record<Signal, string> = {
  STRONG_BUY: "bg-emerald-600 text-white",
  BUY: "bg-green-500/15 text-green-700 dark:text-green-400",
  WATCH: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  SELL: "bg-red-500/15 text-red-700 dark:text-red-400",
  AVOID: "bg-muted text-muted-foreground",
};

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
}

function formatPrice(p: number): string {
  return `₹${p.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function ScoreBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span>{value}/{max}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function StockCard({ pick }: { pick: StockPick }) {
  const { quote, score, signal, breakdown, rationale, intradayRange, gapPercent } = pick;
  const isUp = quote.changePercent >= 0;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-lg">{quote.symbol}</CardTitle>
            <CardDescription className="line-clamp-1">{quote.name}</CardDescription>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge className={SIGNAL_STYLES[signal]}>{signal.replace("_", " ")}</Badge>
            <span className="text-2xl font-bold tabular-nums">{score}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-semibold tabular-nums">{formatPrice(quote.price)}</p>
            <p className={`flex items-center gap-1 text-sm font-medium ${isUp ? "text-green-600" : "text-red-600"}`}>
              {isUp ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              {isUp ? "+" : ""}{quote.changePercent.toFixed(2)}%
              <span className="text-muted-foreground font-normal">
                ({isUp ? "+" : ""}{formatPrice(quote.change)})
              </span>
            </p>
          </div>
          <div className="text-right text-sm text-muted-foreground space-y-0.5">
            <p>Vol: {formatVolume(quote.volume)}</p>
            <p>Range: {intradayRange.toFixed(1)}%</p>
            {gapPercent !== 0 && <p>Gap: {gapPercent > 0 ? "+" : ""}{gapPercent.toFixed(1)}%</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div><span className="text-muted-foreground">Open</span> {formatPrice(quote.open)}</div>
          <div><span className="text-muted-foreground">Prev</span> {formatPrice(quote.previousClose)}</div>
          <div><span className="text-muted-foreground">High</span> {formatPrice(quote.high)}</div>
          <div><span className="text-muted-foreground">Low</span> {formatPrice(quote.low)}</div>
        </div>

        <div className="space-y-2 pt-1 border-t">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Score breakdown</p>
          <ScoreBar label="Volume" value={breakdown.volume} max={25} />
          <ScoreBar label="Volatility" value={breakdown.volatility} max={25} />
          <ScoreBar label="Momentum" value={breakdown.momentum} max={25} />
          <ScoreBar label="Range position" value={breakdown.rangePosition} max={25} />
          <ScoreBar label="Liquidity" value={breakdown.liquidity} max={20} />
        </div>

        <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
          {rationale.map((note, i) => (
            <li key={i}>{note}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ScreenerDashboard({ embedded }: { embedded?: boolean }) {
  const [index, setIndex] = useState<IndexUniverse>("NIFTY50");
  const [minScore, setMinScore] = useState("55");
  const [signalFilter, setSignalFilter] = useState<string>("all");
  const [data, setData] = useState<ScreenerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScreen = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ index, minScore });
      if (signalFilter !== "all") params.set("signal", signalFilter);
      const res = await fetch(`/api/screen?${params}`);
      if (!res.ok) throw new Error("Failed to load screener data");
      const json: ScreenerResponse = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [index, minScore, signalFilter]);

  useEffect(() => {
    fetchScreen();
    const interval = setInterval(fetchScreen, 60_000);
    return () => clearInterval(interval);
  }, [fetchScreen]);

  const buyCount = data?.picks.filter((p) => p.signal === "BUY" || p.signal === "STRONG_BUY").length ?? 0;
  const sellCount = data?.picks.filter((p) => p.signal === "SELL").length ?? 0;

  return (
    <div className={embedded ? "space-y-6" : "min-h-screen bg-gradient-to-b from-background to-muted/30"}>
      {!embedded && (
      <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">IntradayPulse</h1>
              <p className="text-sm text-muted-foreground">NSE & BSE intraday stock screener</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {data && (
              <Badge variant="outline" className="capitalize">
                Market {data.marketStatus.toLowerCase().replace("_", " ")}
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={fetchScreen} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </header>
      )}

      {embedded && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Intraday Screener</h2>
            <p className="text-muted-foreground text-sm">Find liquid stocks with intraday movement</p>
          </div>
          <div className="flex items-center gap-2">
            {data && (
              <Badge variant="outline" className="capitalize">
                Market {data.marketStatus.toLowerCase().replace("_", " ")}
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={fetchScreen} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      )}

      <div className={embedded ? "space-y-6" : "container mx-auto px-4 py-6 space-y-6"}>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Not financial advice</AlertTitle>
          <AlertDescription>
            {data?.disclaimer ??
              "This screener ranks stocks by volume, volatility, and momentum. Most intraday traders lose money. Always use stop-losses and trade only with risk capital."}
          </AlertDescription>
        </Alert>

        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Universe</label>
            <Select value={index} onValueChange={(v) => setIndex(v as IndexUniverse)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NIFTY50">NIFTY 50</SelectItem>
                <SelectItem value="NIFTY100">NIFTY 100</SelectItem>
                <SelectItem value="BANKNIFTY">Bank NIFTY</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Min score</label>
            <Select value={minScore} onValueChange={(v) => v && setMinScore(v)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="45">45+</SelectItem>
                <SelectItem value="55">55+</SelectItem>
                <SelectItem value="65">65+</SelectItem>
                <SelectItem value="75">75+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Signal</label>
            <Select value={signalFilter} onValueChange={(v) => v && setSignalFilter(v)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All signals</SelectItem>
                <SelectItem value="STRONG_BUY">Strong Buy</SelectItem>
                <SelectItem value="BUY">Buy</SelectItem>
                <SelectItem value="WATCH">Watch</SelectItem>
                <SelectItem value="SELL">Sell</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {!loading && data && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">Stocks screened</p>
                <p className="text-2xl font-bold">{data.picks.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5 text-green-600" /> Buy setups
                </p>
                <p className="text-2xl font-bold text-green-600">{buyCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">Bearish setups</p>
                <p className="text-2xl font-bold text-red-600">{sellCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">Data source</p>
                <p className="text-2xl font-bold capitalize">{data.dataSource}</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="picks">
          <TabsList>
            <TabsTrigger value="picks">Top picks</TabsTrigger>
            <TabsTrigger value="guide">Trading guide</TabsTrigger>
          </TabsList>

          <TabsContent value="picks" className="mt-4">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {loading ? (
              <LoadingSkeleton />
            ) : data?.picks.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No stocks match your filters. Try lowering the minimum score or changing the universe.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data?.picks.map((pick) => (
                  <StockCard key={pick.quote.symbol} pick={pick} />
                ))}
              </div>
            )}
            {data && (
              <p className="text-xs text-muted-foreground text-center mt-6">
                Last updated: {new Date(data.scannedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST
              </p>
            )}
          </TabsContent>

          <TabsContent value="guide" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Can you make money intraday trading?</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-3">
                  <p>
                    Some traders do, but SEBI studies and broker data consistently show that a large majority of
                    retail intraday traders lose money over time. Transaction costs, taxes (STT, GST), and emotional
                    decisions eat into small edges quickly.
                  </p>
                  <p>
                    A screener like this helps you find <strong className="text-foreground">liquid stocks with movement</strong> —
                    it does not predict the future. Treat signals as a starting point for your own analysis.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>How this screener scores stocks</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p><strong className="text-foreground">Volume</strong> — Above-average volume means tighter spreads and easier exits.</p>
                  <p><strong className="text-foreground">Volatility</strong> — A 1.5–4% day range gives room for intraday moves without chaos.</p>
                  <p><strong className="text-foreground">Momentum</strong> — Moderate directional moves (1–3.5%) are preferred over exhausted spikes.</p>
                  <p><strong className="text-foreground">Range position</strong> — Price near the day&apos;s high (bullish) or low (bearish) for trend continuation setups.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Rules for safer intraday trading</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Risk only 1–2% of capital per trade; always use a stop-loss.</li>
                    <li>Trade liquid NIFTY stocks — avoid illiquid small caps for intraday.</li>
                    <li>Short selling in cash segment is not allowed; you need F&O for bearish trades.</li>
                    <li>Factor in brokerage, STT (0.025% on sell), and 20% slab-wise income tax on profits.</li>
                    <li>Paper trade for at least 30 sessions before using real money.</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Next steps for this app</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Connect a broker API (Zerodha Kite, Angel One, Upstox) for live orders.</li>
                    <li>Add VWAP, RSI, and opening-range breakout filters.</li>
                    <li>Integrate NSE live feed for sub-second quotes during market hours.</li>
                    <li>Backtest the scoring model on historical intraday data.</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
