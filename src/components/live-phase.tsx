"use client";

import { useTrading } from "@/components/trading-context";
import { RiskCalculator } from "@/components/calculators";
import { JournalTable, TradeForm } from "@/components/journal-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { computeExpectancy } from "@/lib/analytics";
import type { Strategy } from "@/lib/journal-types";
import { Shield, Target } from "lucide-react";

const STRATEGIES: Strategy[] = ["ORB", "VWAP_RECLAIM", "MOMENTUM", "GAP_FADE", "SWING", "OTHER"];

export function LivePhase() {
  const { state, openTrade, closeTrade, deleteTrade, updateProfile, advancePhase } = useTrading();
  const liveTrades = state.journal.filter((t) => !t.isPaper);
  const stats = computeExpectancy(liveTrades);
  const { profile } = state;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Phase 3: Go Live Small</h2>
        <p className="text-muted-foreground mt-1">
          Start with ₹25,000–50,000. One strategy only. Strict 1% risk per trade.
          Feel real money emotions with small position sizes.
        </p>
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>Live trading rules</AlertTitle>
        <AlertDescription>
          Risk only {profile.riskPercent}% per trade (₹{(profile.liveCapital * profile.riskPercent / 100).toFixed(0)} max loss).
          Start with 1 share or 1 lot. One strategy: <strong>{profile.activeStrategy.replace("_", " ")}</strong>.
          Never add capital to recover losses.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Live capital</p>
            <p className="text-2xl font-bold">₹{profile.liveCapital.toLocaleString("en-IN")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Available cash</p>
            <p className="text-2xl font-bold">₹{profile.liveCash.toLocaleString("en-IN")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Live P&L</p>
            <p className={`text-2xl font-bold ${stats.totalPnl >= 0 ? "text-green-600" : "text-red-600"}`}>
              {stats.totalPnl >= 0 ? "+" : ""}₹{stats.totalPnl.toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label>Live capital (₹)</Label>
              <Input
                type="number"
                value={profile.liveCapital}
                onChange={(e) => updateProfile({ liveCapital: Number(e.target.value), liveCash: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Risk per trade (%)</Label>
              <Input
                type="number"
                value={profile.riskPercent}
                onChange={(e) => updateProfile({ riskPercent: Number(e.target.value) })}
                min="0.5"
                max="3"
                step="0.5"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Strategy</Label>
              <Select
                value={profile.activeStrategy}
                onValueChange={(v) => v && updateProfile({ activeStrategy: v as Strategy })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STRATEGIES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Max loss/trade</Label>
              <p className="text-lg font-bold text-red-600 pt-1">
                ₹{(profile.liveCapital * profile.riskPercent / 100).toFixed(0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <TradeForm
            isPaper={false}
            onSubmit={openTrade}
            defaultStrategy={profile.activeStrategy}
          />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Live Trade Journal</CardTitle>
              <CardDescription>{stats.closedTrades} closed · {stats.openTrades} open</CardDescription>
            </CardHeader>
            <CardContent>
              <JournalTable trades={liveTrades} onClose={closeTrade} onDelete={deleteTrade} showEmotions />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <RiskCalculator capital={profile.liveCapital} riskPercent={profile.riskPercent} />

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4" /> Live Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between"><span>Win rate</span><span className="font-bold">{stats.winRate}%</span></div>
              <div className="flex justify-between"><span>Expectancy</span><span className={`font-bold ${stats.isPositiveExpectancy ? "text-green-600" : "text-red-600"}`}>₹{stats.expectancy}</span></div>
              <div className="flex justify-between"><span>Profit factor</span><span className="font-bold">{stats.profitFactor}</span></div>
            </CardContent>
          </Card>

          {stats.closedTrades >= 10 && stats.totalPnl > 0 && (
            <Card className="border-green-500/50 bg-green-500/5">
              <CardContent className="pt-4">
                <p className="font-medium text-green-700 dark:text-green-400 mb-2">
                  Profitable live trading! Ready to scale.
                </p>
                <Button onClick={() => advancePhase(4)} className="w-full">
                  Start Phase 4: Scale →
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
