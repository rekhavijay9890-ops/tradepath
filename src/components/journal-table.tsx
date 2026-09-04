"use client";

import type { Emotion, JournalEntry, Strategy, TradeType } from "@/lib/journal-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { emotionBreakdown } from "@/lib/analytics";
import { Trash2, XCircle } from "lucide-react";
import { useState } from "react";

const EMOTIONS: Emotion[] = ["CALM", "CONFIDENT", "FEARFUL", "FOMO", "REVENGE", "ANXIOUS", "GREEDY"];
const STRATEGIES: Strategy[] = ["ORB", "VWAP_RECLAIM", "MOMENTUM", "GAP_FADE", "SWING", "OTHER"];

const EMOTION_COLORS: Record<Emotion, string> = {
  CALM: "bg-blue-500/15 text-blue-700",
  CONFIDENT: "bg-green-500/15 text-green-700",
  FEARFUL: "bg-orange-500/15 text-orange-700",
  FOMO: "bg-red-500/15 text-red-700",
  REVENGE: "bg-red-600/15 text-red-800",
  ANXIOUS: "bg-yellow-500/15 text-yellow-700",
  GREEDY: "bg-purple-500/15 text-purple-700",
};

interface JournalTableProps {
  trades: JournalEntry[];
  onClose: (id: string, exitPrice: number, exitReason: string) => void;
  onDelete: (id: string) => void;
  showEmotions?: boolean;
}

export function JournalTable({ trades, onClose, onDelete, showEmotions }: JournalTableProps) {
  const [closingId, setClosingId] = useState<string | null>(null);
  const [exitPrice, setExitPrice] = useState("");
  const [exitReason, setExitReason] = useState("");

  const handleClose = () => {
    if (!closingId || !exitPrice) return;
    onClose(closingId, Number(exitPrice), exitReason);
    setClosingId(null);
    setExitPrice("");
    setExitReason("");
  };

  if (trades.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No trades yet. Place your first paper trade above.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {showEmotions && (
        <EmotionInsights trades={trades} />
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 pr-3">Date</th>
              <th className="pb-2 pr-3">Symbol</th>
              <th className="pb-2 pr-3">Strategy</th>
              <th className="pb-2 pr-3">Entry</th>
              <th className="pb-2 pr-3">Exit</th>
              <th className="pb-2 pr-3">Qty</th>
              <th className="pb-2 pr-3">P&L</th>
              <th className="pb-2 pr-3">Emotion</th>
              <th className="pb-2 pr-3">Reason</th>
              <th className="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => (
              <tr key={t.id} className="border-b border-muted">
                <td className="py-2 pr-3 text-xs">{t.sessionDate}</td>
                <td className="py-2 pr-3 font-medium">{t.symbol}</td>
                <td className="py-2 pr-3"><Badge variant="outline" className="text-xs">{t.strategy}</Badge></td>
                <td className="py-2 pr-3">₹{t.entryPrice}</td>
                <td className="py-2 pr-3">{t.exitPrice ? `₹${t.exitPrice}` : "—"}</td>
                <td className="py-2 pr-3">{t.quantity}</td>
                <td className={`py-2 pr-3 font-medium ${(t.pnl ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {t.pnl != null ? `${t.pnl >= 0 ? "+" : ""}₹${t.pnl}` : "—"}
                </td>
                <td className="py-2 pr-3">
                  <Badge className={`text-xs ${EMOTION_COLORS[t.emotion]}`}>{t.emotion}</Badge>
                </td>
                <td className="py-2 pr-3 text-xs text-muted-foreground max-w-[120px] truncate">{t.entryReason}</td>
                <td className="py-2">
                  <div className="flex gap-1">
                    {t.status === "OPEN" && (
                      <Dialog open={closingId === t.id} onOpenChange={(o) => !o && setClosingId(null)}>
                        <DialogTrigger
                          render={
                            <Button size="sm" variant="outline" onClick={() => { setClosingId(t.id); setExitPrice(String(t.entryPrice)); }}>
                              Close
                            </Button>
                          }
                        />
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Close {t.symbol}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3">
                            <div className="space-y-1.5">
                              <Label>Exit price (₹)</Label>
                              <Input value={exitPrice} onChange={(e) => setExitPrice(e.target.value)} type="number" />
                            </div>
                            <div className="space-y-1.5">
                              <Label>Exit reason</Label>
                              <Textarea value={exitReason} onChange={(e) => setExitReason(e.target.value)} placeholder="Target hit / Stop-loss / Time exit..." />
                            </div>
                            <Button onClick={handleClose} className="w-full">Close trade</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => onDelete(t.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EmotionInsights({ trades }: { trades: JournalEntry[] }) {
  const breakdown = emotionBreakdown(trades);
  const entries = Object.entries(breakdown).sort((a, b) => b[1].count - a[1].count);

  if (entries.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Emotion vs P&L</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {entries.map(([emotion, data]) => (
            <Badge key={emotion} variant="outline" className="text-xs">
              {emotion}: {data.count} trades, {data.pnl >= 0 ? "+" : ""}₹{data.pnl.toFixed(0)}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Warning: REVENGE and FOMO trades usually lose money. Trade only when CALM or CONFIDENT.
        </p>
      </CardContent>
    </Card>
  );
}

interface TradeFormProps {
  isPaper: boolean;
  onSubmit: (trade: {
    symbol: string;
    name: string;
    side: "BUY";
    type: TradeType;
    strategy: Strategy;
    quantity: number;
    entryPrice: number;
    stopLoss?: number;
    target?: number;
    entryReason: string;
    emotion: Emotion;
    isPaper: boolean;
    sessionDate: string;
  }) => void;
  defaultStrategy?: Strategy;
}

export function TradeForm({ isPaper, onSubmit, defaultStrategy = "ORB" }: TradeFormProps) {
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("1");
  const [sl, setSl] = useState("");
  const [target, setTarget] = useState("");
  const [reason, setReason] = useState("");
  const [emotion, setEmotion] = useState<Emotion>("CALM");
  const [strategy, setStrategy] = useState<Strategy>(defaultStrategy);
  const [type, setType] = useState<TradeType>("INTRADAY");
  const [loading, setLoading] = useState(false);

  const fetchQuote = async () => {
    if (!symbol) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/quote?symbol=${symbol}`);
      const data = await res.json();
      if (data.price) {
        setPrice(String(data.price));
        setName(data.name);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !price || !qty || !reason) return;
    onSubmit({
      symbol: symbol.toUpperCase(),
      name: name || symbol,
      side: "BUY",
      type,
      strategy,
      quantity: Number(qty),
      entryPrice: Number(price),
      stopLoss: sl ? Number(sl) : undefined,
      target: target ? Number(target) : undefined,
      entryReason: reason,
      emotion,
      isPaper,
      sessionDate: new Date().toISOString().slice(0, 10),
    });
    setSymbol("");
    setName("");
    setPrice("");
    setQty("1");
    setSl("");
    setTarget("");
    setReason("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {isPaper ? "Place Paper Trade" : "Log Live Trade"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label>Symbol</Label>
              <div className="flex gap-1">
                <Input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} placeholder="RELIANCE" />
                <Button type="button" variant="outline" size="sm" onClick={fetchQuote} disabled={loading}>
                  {loading ? "..." : "Go"}
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Entry price (₹)</Label>
              <Input value={price} onChange={(e) => setPrice(e.target.value)} type="number" step="0.05" />
            </div>
            <div className="space-y-1.5">
              <Label>Quantity</Label>
              <Input value={qty} onChange={(e) => setQty(e.target.value)} type="number" min="1" />
            </div>
            <div className="space-y-1.5">
              <Label>Stop-loss (₹)</Label>
              <Input value={sl} onChange={(e) => setSl(e.target.value)} type="number" step="0.05" placeholder="Required!" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label>Strategy</Label>
              <Select value={strategy} onValueChange={(v) => v && setStrategy(v as Strategy)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STRATEGIES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => v && setType(v as TradeType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="INTRADAY">Intraday</SelectItem>
                  <SelectItem value="DELIVERY">Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Emotion</Label>
              <Select value={emotion} onValueChange={(v) => v && setEmotion(v as Emotion)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EMOTIONS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Target (₹)</Label>
              <Input value={target} onChange={(e) => setTarget(e.target.value)} type="number" step="0.05" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Entry reason</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="ORB breakout above ₹500 with 2× volume..."
              rows={2}
            />
          </div>

          <Button type="submit" className="w-full" disabled={!sl}>
            {!sl ? "Set stop-loss to place trade" : isPaper ? "Buy (Paper)" : "Log Buy (Live)"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
