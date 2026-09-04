"use client";

import { useTrading } from "@/components/trading-context";
import { DashboardStats } from "@/components/phase-progress";
import { JournalTable, TradeForm } from "@/components/journal-table";
import { RiskCalculator } from "@/components/calculators";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { computeExpectancy } from "@/lib/analytics";
import { LineChart, Target, TrendingUp } from "lucide-react";

export function PaperTradePhase() {
  const { state, openTrade, closeTrade, deleteTrade, advancePhase } = useTrading();
  const paperTrades = state.journal.filter((t) => t.isPaper);
  const stats = computeExpectancy(paperTrades);
  const readyForPhase3 = stats.sessions >= 30 && stats.isPositiveExpectancy;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Phase 2: Paper Trade</h2>
        <p className="text-muted-foreground mt-1">
          30+ sessions with real market data. Track every trade: entry, exit, reason, P&L, and emotion.
          Target: positive expectancy before going live.
        </p>
      </div>

      <DashboardStats />

      <Alert>
        <LineChart className="h-4 w-4" />
        <AlertTitle>Paper trading rules</AlertTitle>
        <AlertDescription>
          Trade as if it&apos;s real money. Always set stop-loss. Log your emotion honestly.
          One strategy only. Max 2–3 trades per session. Stop after 2 consecutive losses.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <TradeForm
            isPaper
            onSubmit={openTrade}
            defaultStrategy={state.profile.activeStrategy}
          />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Trade Journal</CardTitle>
              <CardDescription>
                {stats.closedTrades} closed · {stats.openTrades} open · {stats.sessions} sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <JournalTable
                trades={paperTrades}
                onClose={closeTrade}
                onDelete={deleteTrade}
                showEmotions
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4" /> Expectancy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-muted-foreground">Win rate</p>
                  <p className="text-lg font-bold">{stats.winRate}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Avg win</p>
                  <p className="text-lg font-bold text-green-600">₹{stats.avgWin}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Avg loss</p>
                  <p className="text-lg font-bold text-red-600">₹{stats.avgLoss}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Profit factor</p>
                  <p className="text-lg font-bold">{stats.profitFactor}</p>
                </div>
              </div>
              <div className={`rounded-lg p-3 ${stats.isPositiveExpectancy ? "bg-green-500/10" : "bg-red-500/10"}`}>
                <p className="text-muted-foreground">Expectancy per trade</p>
                <p className={`text-2xl font-bold ${stats.isPositiveExpectancy ? "text-green-600" : "text-red-600"}`}>
                  ₹{stats.expectancy}
                </p>
                <p className="text-xs mt-1">
                  Formula: (win% × avg win) − (loss% × avg loss)
                </p>
                {stats.isPositiveExpectancy ? (
                  <p className="text-xs text-green-700 mt-1">Positive expectancy — your edge is working!</p>
                ) : (
                  <p className="text-xs text-red-700 mt-1">Negative expectancy — keep paper trading, don&apos;t go live yet.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <RiskCalculator capital={state.profile.paperCapital} riskPercent={state.profile.riskPercent} />

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Session Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.sessions}<span className="text-lg text-muted-foreground">/30</span></p>
              <p className="text-sm text-muted-foreground mt-1">Unique trading days with at least one trade</p>
            </CardContent>
          </Card>

          {readyForPhase3 && (
            <Card className="border-green-500/50 bg-green-500/5">
              <CardContent className="pt-4">
                <p className="font-medium text-green-700 dark:text-green-400 mb-2">
                  30+ sessions with positive expectancy! Ready for live trading.
                </p>
                <Button onClick={() => advancePhase(3)} className="w-full">
                  Start Phase 3: Go Live →
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
