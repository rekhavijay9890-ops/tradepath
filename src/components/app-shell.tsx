"use client";

import { GettingStarted } from "@/components/getting-started";
import { LearnPhase } from "@/components/learn-phase";
import { LivePhase } from "@/components/live-phase";
import { PaperTradePhase } from "@/components/paper-trade-phase";
import { DashboardStats, PhaseProgress } from "@/components/phase-progress";
import { ScalePhase } from "@/components/scale-phase";
import { ScreenerDashboard } from "@/components/screener-dashboard";
import { TradingProvider, useTrading } from "@/components/trading-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PhaseId } from "@/lib/journal-types";
import {
  BarChart3,
  BookOpen,
  LineChart,
  Rocket,
  RotateCcw,
  Target,
  TrendingUp,
} from "lucide-react";

const NAV_ITEMS: { id: string; label: string; icon: typeof BookOpen; phase?: PhaseId }[] = [
  { id: "dashboard", label: "Dashboard", icon: TrendingUp },
  { id: "learn", label: "Phase 1: Learn", icon: BookOpen, phase: 1 },
  { id: "paper", label: "Phase 2: Paper", icon: LineChart, phase: 2 },
  { id: "live", label: "Phase 3: Live", icon: Target, phase: 3 },
  { id: "scale", label: "Phase 4: Scale", icon: Rocket, phase: 4 },
  { id: "screener", label: "Screener", icon: BarChart3 },
];

function AppContent() {
  const { state, resetAll } = useTrading();
  const { currentPhase } = state.profile;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">TradePath</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  NSE/BSE trading journey — Learn → Paper → Live → Scale
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Phase {currentPhase}/4</Badge>
              <Button variant="ghost" size="sm" onClick={resetAll} title="Reset all data">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="dashboard">
          <TabsList className="flex flex-wrap h-auto gap-1 mb-6">
            {NAV_ITEMS.map((item) => (
              <TabsTrigger key={item.id} value={item.id} className="text-xs sm:text-sm gap-1.5">
                <item.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{item.label}</span>
                <span className="sm:hidden">
                  {item.phase ? `P${item.phase}` : item.id === "screener" ? "Scan" : "Home"}
                </span>
                {item.phase === currentPhase && (
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <GettingStarted />
            <PhaseProgress />
            <DashboardStats />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[
                { phase: 1, title: "Learn", desc: "Order types, margin, costs, taxes. Observe the market daily.", tab: "learn" },
                { phase: 2, title: "Paper Trade", desc: "30+ sessions with journal. Target positive expectancy.", tab: "paper" },
                { phase: 3, title: "Go Live", desc: "₹25K–50K capital. 1% risk per trade. One strategy.", tab: "live" },
                { phase: 4, title: "Scale", desc: "3 profitable months before increasing size.", tab: "scale" },
              ].map((p) => (
                <div
                  key={p.phase}
                  className={`rounded-lg border p-4 space-y-2 ${currentPhase === p.phase ? "border-primary bg-primary/5" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <Badge variant={currentPhase === p.phase ? "default" : "outline"}>Phase {p.phase}</Badge>
                    <span className="font-medium">{p.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{p.desc}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="learn"><LearnPhase /></TabsContent>
          <TabsContent value="paper"><PaperTradePhase /></TabsContent>
          <TabsContent value="live"><LivePhase /></TabsContent>
          <TabsContent value="scale"><ScalePhase /></TabsContent>
          <TabsContent value="screener"><ScreenerDashboard embedded /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export function AppShell() {
  return (
    <TradingProvider>
      <AppContent />
    </TradingProvider>
  );
}
