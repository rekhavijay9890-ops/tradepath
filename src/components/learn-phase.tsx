"use client";

import { useTrading } from "@/components/trading-context";
import { CostCalculator, LearnChecklist, MarginCalculator } from "@/components/calculators";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LEARN_MODULES } from "@/lib/learn-content";
import { BookOpen, CheckCircle2, ExternalLink } from "lucide-react";

export function LearnPhase() {
  const { state, toggleLearnItem, advancePhase } = useTrading();
  const completed = Object.values(state.profile.learnChecklist).filter(Boolean).length;
  const allDone = completed >= LEARN_MODULES.length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Phase 1: Learn</h2>
        <p className="text-muted-foreground mt-1">
          2–4 weeks to understand order types, margin, costs, taxes, and market behavior.
          Use the Screener tab daily to observe which stocks move and why.
        </p>
      </div>

      <Alert>
        <BookOpen className="h-4 w-4" />
        <AlertTitle>Your goal</AlertTitle>
        <AlertDescription>
          Complete all {LEARN_MODULES.length} learning modules below. Read at least one recommended book.
          Open the Screener daily and note which stocks rank high and why — do NOT trade yet.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {LEARN_MODULES.map((mod) => {
            const done = state.profile.learnChecklist[mod.id];
            return (
              <Card key={mod.id} className={done ? "opacity-75" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{mod.title}</CardTitle>
                    <Button
                      size="sm"
                      variant={done ? "outline" : "default"}
                      onClick={() => toggleLearnItem(mod.id)}
                    >
                      {done ? (
                        <><CheckCircle2 className="h-4 w-4 mr-1" /> Done</>
                      ) : (
                        "Mark complete"
                      )}
                    </Button>
                  </div>
                  <CardDescription>{mod.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {mod.items.map((item) => (
                    <div key={item.id} className="border-l-2 border-primary/30 pl-3">
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{item.content}</p>
                      {item.example && (
                        <p className="text-xs text-primary mt-1 bg-primary/5 rounded px-2 py-1">
                          Example: {item.example}
                        </p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="space-y-4">
          <LearnChecklist />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recommended Books</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium">Trading in the Zone</p>
                <p className="text-muted-foreground">Mark Douglas — trading psychology</p>
              </div>
              <div>
                <p className="font-medium">How to Make Money in Stocks</p>
                <p className="text-muted-foreground">William O&apos;Neil — CAN SLIM stock selection</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Daily Observation Task</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>1. Open the <strong className="text-foreground">Screener</strong> tab at 9:30 AM IST</p>
              <p>2. Note top 3 stocks and their scores</p>
              <p>3. Check again at 2:00 PM — what changed?</p>
              <p>4. Write observations in a notebook (not in the app yet)</p>
            </CardContent>
          </Card>

          {allDone && (
            <Card className="border-green-500/50 bg-green-500/5">
              <CardContent className="pt-4">
                <p className="font-medium text-green-700 dark:text-green-400 mb-2">
                  Phase 1 complete! Ready for paper trading.
                </p>
                <Button onClick={() => advancePhase(2)} className="w-full">
                  Start Phase 2: Paper Trade →
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <CostCalculator />
        <MarginCalculator />
      </div>
    </div>
  );
}
