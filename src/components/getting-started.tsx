"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BookOpen, LineChart, Rocket, Target } from "lucide-react";

const STEPS = [
  {
    step: 1,
    title: "Learn basics (2–4 weeks)",
    simple: "Read how trading works. Do NOT buy any stock yet.",
    tab: "Phase 1: Learn",
    icon: BookOpen,
  },
  {
    step: 2,
    title: "Practice with fake money",
    simple: "Trade on paper — like a game. No real money. Write down every trade.",
    tab: "Phase 2: Paper",
    icon: LineChart,
  },
  {
    step: 3,
    title: "Use small real money",
    simple: "Only after practice works. Start with ₹25,000–50,000. Very small trades.",
    tab: "Phase 3: Live",
    icon: Target,
  },
  {
    step: 4,
    title: "Grow slowly",
    simple: "Only if you made profit for 3 months in a row. Never rush.",
    tab: "Phase 4: Scale",
    icon: Rocket,
  },
];

export function GettingStarted() {
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-xl">Start here — read this first</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-lg bg-background p-4 text-sm space-y-2">
          <p className="font-medium text-base">What is this app?</p>
          <p className="text-muted-foreground">
            This app helps you learn stock trading step by step — like learning to drive
            in a training car before going on the real road.{" "}
            <strong className="text-foreground">Most people lose money</strong> when they
            jump straight to buying stocks. This app stops you from doing that.
          </p>
        </div>

        <div className="rounded-lg bg-background p-4 text-sm space-y-2">
          <p className="font-medium text-base">What is intraday trading?</p>
          <p className="text-muted-foreground">
            You buy a stock in the morning and sell it the same day before 3:30 PM.
            Example: Buy Reliance at ₹2,400 at 10 AM → sell at ₹2,420 at 2 PM → profit ₹20 per share.
            But if price drops, you lose money. That is why we practice first.
          </p>
        </div>

        <div className="space-y-3">
          <p className="font-medium">Follow these 4 steps in order:</p>
          {STEPS.map((s) => (
            <div key={s.step} className="flex gap-3 items-start rounded-lg border bg-background p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                {s.step}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <s.icon className="h-4 w-4 text-primary" />
                  <p className="font-medium">{s.title}</p>
                </div>
                <p className="text-sm text-muted-foreground">{s.simple}</p>
                <p className="text-xs text-primary flex items-center gap-1">
                  <ArrowRight className="h-3 w-3" /> Click the <strong>&quot;{s.tab}&quot;</strong> tab above
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
          <p className="font-medium">What to do RIGHT NOW (today):</p>
          <ol className="list-decimal pl-5 mt-2 space-y-1 text-muted-foreground">
            <li>Click <strong className="text-foreground">Phase 1: Learn</strong> tab</li>
            <li>Read the first module &quot;Order Types&quot;</li>
            <li>Click <strong className="text-foreground">Screener</strong> tab — see which stocks are moving today</li>
            <li>Do NOT place any trade today. Just read and observe.</li>
          </ol>
        </div>

        <div className="text-sm text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">Simple words explained:</p>
          <p><strong>Stop-loss</strong> = automatic sell if price goes down (limits your loss)</p>
          <p><strong>Paper trade</strong> = fake money practice, feels real but costs nothing</p>
          <p><strong>Screener</strong> = finds stocks that are active today (high volume, moving price)</p>
          <p><strong>NSE</strong> = National Stock Exchange (where Indian stocks trade)</p>
        </div>
      </CardContent>
    </Card>
  );
}
