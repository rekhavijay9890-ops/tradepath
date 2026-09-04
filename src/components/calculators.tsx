"use client";

import { useTrading } from "@/components/trading-context";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  calculateMarginRequired,
  calculatePositionSize,
  calculateTaxOnProfit,
  calculateTradeCosts,
} from "@/lib/costs";
import { LEARN_MODULES } from "@/lib/learn-content";
import { Calculator, CheckCircle2, Circle } from "lucide-react";
import { useState } from "react";

export function CostCalculator() {
  const [buyValue, setBuyValue] = useState("100000");
  const [sellValue, setSellValue] = useState("101500");
  const [isIntraday, setIsIntraday] = useState(true);

  const costs = calculateTradeCosts(Number(buyValue), Number(sellValue), isIntraday);
  const grossPnl = Number(sellValue) - Number(buyValue);
  const netPnl = grossPnl - costs.total;
  const tax = calculateTaxOnProfit(netPnl, isIntraday);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Calculator className="h-4 w-4" /> Cost & Tax Calculator
        </CardTitle>
        <CardDescription>See how costs and taxes eat into your profits</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Buy value (₹)</Label>
            <Input value={buyValue} onChange={(e) => setBuyValue(e.target.value)} type="number" />
          </div>
          <div className="space-y-1.5">
            <Label>Sell value (₹)</Label>
            <Input value={sellValue} onChange={(e) => setSellValue(e.target.value)} type="number" />
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant={isIntraday ? "default" : "outline"} onClick={() => setIsIntraday(true)}>
            Intraday
          </Button>
          <Button size="sm" variant={!isIntraday ? "default" : "outline"} onClick={() => setIsIntraday(false)}>
            Delivery
          </Button>
        </div>
        <Separator />
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-muted-foreground">Brokerage</span><span>₹{costs.brokerage}</span>
          <span className="text-muted-foreground">STT</span><span>₹{costs.stt}</span>
          <span className="text-muted-foreground">Exchange + SEBI + GST</span><span>₹{costs.exchange + costs.sebi + costs.gst}</span>
          <span className="text-muted-foreground">Stamp duty</span><span>₹{costs.stampDuty}</span>
          <span className="font-medium">Total costs</span><span className="font-medium text-red-600">₹{costs.total}</span>
          <span className="font-medium">Gross P&L</span><span className={grossPnl >= 0 ? "text-green-600" : "text-red-600"}>₹{grossPnl.toFixed(0)}</span>
          <span className="font-medium">Net P&L</span><span className={netPnl >= 0 ? "text-green-600" : "text-red-600"}>₹{netPnl.toFixed(0)}</span>
          <span className="font-medium">Est. tax</span><span>₹{tax}</span>
          <span className="font-medium">After tax</span><span className="font-bold">₹{(netPnl - tax).toFixed(0)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function MarginCalculator() {
  const [price, setPrice] = useState("500");
  const [qty, setQty] = useState("100");
  const [leverage, setLeverage] = useState("5");

  const total = Number(price) * Number(qty);
  const margin = calculateMarginRequired(Number(price), Number(qty), Number(leverage));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Margin Calculator</CardTitle>
        <CardDescription>How much margin you need for intraday</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>Price (₹)</Label>
            <Input value={price} onChange={(e) => setPrice(e.target.value)} type="number" />
          </div>
          <div className="space-y-1.5">
            <Label>Quantity</Label>
            <Input value={qty} onChange={(e) => setQty(e.target.value)} type="number" />
          </div>
          <div className="space-y-1.5">
            <Label>Leverage (×)</Label>
            <Input value={leverage} onChange={(e) => setLeverage(e.target.value)} type="number" />
          </div>
        </div>
        <div className="text-sm space-y-1">
          <p>Position value: <strong>₹{total.toLocaleString("en-IN")}</strong></p>
          <p>Margin required: <strong className="text-primary">₹{margin.toLocaleString("en-IN")}</strong></p>
        </div>
      </CardContent>
    </Card>
  );
}

export function RiskCalculator({ capital, riskPercent }: { capital: number; riskPercent: number }) {
  const [entry, setEntry] = useState("500");
  const [sl, setSl] = useState("490");

  const result = calculatePositionSize(capital, riskPercent, Number(entry), Number(sl));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Position Size Calculator</CardTitle>
        <CardDescription>
          Risk {riskPercent}% of ₹{capital.toLocaleString("en-IN")} = ₹{result.riskAmount} max loss
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Entry price (₹)</Label>
            <Input value={entry} onChange={(e) => setEntry(e.target.value)} type="number" />
          </div>
          <div className="space-y-1.5">
            <Label>Stop-loss (₹)</Label>
            <Input value={sl} onChange={(e) => setSl(e.target.value)} type="number" />
          </div>
        </div>
        <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
          <p>Buy <strong>{result.quantity}</strong> shares</p>
          <p>Position value: <strong>₹{result.positionValue.toLocaleString("en-IN")}</strong></p>
          <p>Max loss if SL hit: <strong className="text-red-600">₹{result.riskAmount}</strong></p>
        </div>
      </CardContent>
    </Card>
  );
}

export function LearnChecklist() {
  const { state, toggleLearnItem } = useTrading();
  const { learnChecklist } = state.profile;

  const completed = Object.values(learnChecklist).filter(Boolean).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Learning Checklist</CardTitle>
        <CardDescription>{completed}/{LEARN_MODULES.length} modules completed</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {LEARN_MODULES.map((mod: { id: string; title: string }) => (
          <button
            key={mod.id}
            onClick={() => toggleLearnItem(mod.id)}
            className="flex items-center gap-2 w-full text-left text-sm p-2 rounded hover:bg-muted transition-colors"
          >
            {learnChecklist[mod.id] ? (
              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <span className={learnChecklist[mod.id] ? "line-through text-muted-foreground" : ""}>
              {mod.title}
            </span>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
