"use client";

import { useTrading } from "@/components/trading-context";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { countConsecutiveProfitableMonths, computeExpectancy, getMonthlyRecords } from "@/lib/analytics";
import { Rocket, TrendingDown, TrendingUp } from "lucide-react";

export function ScalePhase() {
  const { state } = useTrading();
  const liveTrades = state.journal.filter((t) => !t.isPaper);
  const stats = computeExpectancy(liveTrades);
  const monthlyRecords = getMonthlyRecords(state.journal, true);
  const consecutive = countConsecutiveProfitableMonths(monthlyRecords);
  const canScale = consecutive >= 3;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Phase 4: Scale</h2>
        <p className="text-muted-foreground mt-1">
          Scale only after 3 consecutive profitable months. Increase size slowly.
          Never add capital to recover losses.
        </p>
      </div>

      <Alert variant={canScale ? "default" : "destructive"}>
        <Rocket className="h-4 w-4" />
        <AlertTitle>{canScale ? "Ready to scale!" : "Not ready to scale yet"}</AlertTitle>
        <AlertDescription>
          {canScale
            ? "You've had 3 consecutive profitable months. Consider increasing position size by 25% — never double overnight."
            : `You need ${3 - consecutive} more consecutive profitable month(s). Focus on consistency, not size.`}
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Consecutive profitable months</p>
            <p className="text-3xl font-bold">{consecutive}<span className="text-lg text-muted-foreground">/3</span></p>
            <Progress value={(consecutive / 3) * 100} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total live P&L</p>
            <p className={`text-3xl font-bold ${stats.totalPnl >= 0 ? "text-green-600" : "text-red-600"}`}>
              {stats.totalPnl >= 0 ? "+" : ""}₹{stats.totalPnl.toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Live expectancy</p>
            <p className={`text-3xl font-bold ${stats.isPositiveExpectancy ? "text-green-600" : "text-red-600"}`}>
              ₹{stats.expectancy}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monthly P&L</CardTitle>
          <CardDescription>Track your live trading performance month by month</CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyRecords.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">
              No live trades closed yet. Complete Phase 3 first.
            </p>
          ) : (
            <div className="space-y-3">
              {monthlyRecords.map((record) => {
                const isProfit = record.pnl > 0;
                return (
                  <div key={record.month} className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                      {isProfit ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                      <span className="font-medium">{record.month}</span>
                      <Badge variant="outline" className="text-xs">{record.trades} trades</Badge>
                    </div>
                    <span className={`font-bold ${isProfit ? "text-green-600" : "text-red-600"}`}>
                      {isProfit ? "+" : ""}₹{record.pnl.toLocaleString("en-IN")}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Scaling Rules</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <ul className="list-disc pl-4 space-y-1.5">
              <li>Increase position size by max <strong className="text-foreground">25% per month</strong></li>
              <li>Never risk more than <strong className="text-foreground">2%</strong> per trade even when scaling</li>
              <li>If a month is negative, <strong className="text-foreground">reduce size by 50%</strong></li>
              <li>Withdraw profits regularly — don&apos;t let paper gains become real losses</li>
              <li>Keep a 6-month emergency fund outside trading capital</li>
              <li>Never add capital to recover losses</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">When NOT to Scale</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <ul className="list-disc pl-4 space-y-1.5">
              <li>Any losing month in the last 3</li>
              <li>Expectancy dropped below zero</li>
              <li>You&apos;re trading out of emotion (revenge, FOMO)</li>
              <li>Market regime changed (low VIX → high VIX)</li>
              <li>You haven&apos;t reviewed your journal in 2+ weeks</li>
              <li>Position sizes feel uncomfortable — that means too big</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
