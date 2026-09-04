"use client";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useTrading } from "@/components/trading-context";
import { LEARN_MODULES, PHASE_REQUIREMENTS } from "@/lib/learn-content";
import { computeExpectancy } from "@/lib/analytics";
import { countConsecutiveProfitableMonths, getMonthlyRecords } from "@/lib/analytics";
import type { PhaseId } from "@/lib/journal-types";
import { BookOpen, LineChart, Rocket, Target, TrendingUp } from "lucide-react";

const PHASE_ICONS = { 1: BookOpen, 2: LineChart, 3: Target, 4: Rocket };

interface PhaseProgressProps {
  compact?: boolean;
}

export function PhaseProgress({ compact }: PhaseProgressProps) {
  const { state } = useTrading();
  const { profile, journal } = state;
  const paperStats = computeExpectancy(journal.filter((t) => t.isPaper));
  const liveStats = computeExpectancy(journal.filter((t) => !t.isPaper));
  const liveMonths = getMonthlyRecords(journal, true);
  const consecutiveMonths = countConsecutiveProfitableMonths(liveMonths);
  const learnDone = Object.values(profile.learnChecklist).filter(Boolean).length;

  const phases: { id: PhaseId; progress: number; detail: string; ready: boolean }[] = [
    {
      id: 1,
      progress: Math.min(100, (learnDone / LEARN_MODULES.length) * 100),
      detail: `${learnDone}/${LEARN_MODULES.length} modules`,
      ready: learnDone >= LEARN_MODULES.length,
    },
    {
      id: 2,
      progress: Math.min(100, (paperStats.sessions / 30) * 100),
      detail: `${paperStats.sessions}/30 sessions · expectancy ${paperStats.expectancy >= 0 ? "+" : ""}₹${paperStats.expectancy}`,
      ready: paperStats.sessions >= 30 && paperStats.isPositiveExpectancy,
    },
    {
      id: 3,
      progress: liveStats.closedTrades > 0 ? Math.min(100, liveStats.closedTrades * 10) : 0,
      detail: `${liveStats.closedTrades} live trades · ${profile.riskPercent}% risk`,
      ready: liveStats.closedTrades >= 10 && liveStats.totalPnl > 0,
    },
    {
      id: 4,
      progress: Math.min(100, (consecutiveMonths / 3) * 100),
      detail: `${consecutiveMonths}/3 profitable months`,
      ready: consecutiveMonths >= 3,
    },
  ];

  if (compact) {
    const current = phases.find((p) => p.id === profile.currentPhase)!;
    return (
      <div className="flex items-center gap-2 text-sm">
        <Badge variant="outline">Phase {profile.currentPhase}</Badge>
        <Progress value={current.progress} className="w-24 h-2" />
        <span className="text-muted-foreground text-xs">{current.detail}</span>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {phases.map((phase) => {
        const Icon = PHASE_ICONS[phase.id];
        const isActive = profile.currentPhase === phase.id;
        const req = PHASE_REQUIREMENTS[phase.id];

        return (
          <div
            key={phase.id}
            className={`rounded-lg border p-4 space-y-2 ${isActive ? "border-primary bg-primary/5" : ""}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="font-medium text-sm">Phase {phase.id}: {req.title}</span>
              </div>
              {phase.ready && <Badge className="bg-emerald-600 text-white text-xs">Ready</Badge>}
              {isActive && !phase.ready && <Badge variant="secondary" className="text-xs">Active</Badge>}
            </div>
            <Progress value={phase.progress} className="h-2" />
            <p className="text-xs text-muted-foreground">{phase.detail}</p>
          </div>
        );
      })}
    </div>
  );
}

export function DashboardStats() {
  const { state } = useTrading();
  const paperStats = computeExpectancy(state.journal.filter((t) => t.isPaper));
  const { profile } = state;

  const portfolioValue =
    profile.paperCash +
    state.positions.reduce((s, p) => s + p.quantity * p.currentPrice, 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="rounded-lg border p-3">
        <p className="text-xs text-muted-foreground">Paper portfolio</p>
        <p className="text-xl font-bold">₹{portfolioValue.toLocaleString("en-IN")}</p>
        <p className={`text-xs ${paperStats.totalPnl >= 0 ? "text-green-600" : "text-red-600"}`}>
          P&L: {paperStats.totalPnl >= 0 ? "+" : ""}₹{paperStats.totalPnl.toLocaleString("en-IN")}
        </p>
      </div>
      <div className="rounded-lg border p-3">
        <p className="text-xs text-muted-foreground">Win rate</p>
        <p className="text-xl font-bold">{paperStats.winRate}%</p>
        <p className="text-xs text-muted-foreground">{paperStats.closedTrades} closed trades</p>
      </div>
      <div className="rounded-lg border p-3">
        <p className="text-xs text-muted-foreground">Expectancy</p>
        <p className={`text-xl font-bold ${paperStats.isPositiveExpectancy ? "text-green-600" : "text-red-600"}`}>
          ₹{paperStats.expectancy}
        </p>
        <p className="text-xs text-muted-foreground">per trade</p>
      </div>
      <div className="rounded-lg border p-3">
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <TrendingUp className="h-3 w-3" /> Sessions
        </p>
        <p className="text-xl font-bold">{paperStats.sessions}/30</p>
        <p className="text-xs text-muted-foreground">paper trading</p>
      </div>
    </div>
  );
}
