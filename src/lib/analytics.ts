import type { JournalEntry, MonthlyRecord } from "./journal-types";

export interface ExpectancyStats {
  totalTrades: number;
  closedTrades: number;
  openTrades: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  expectancy: number;
  totalPnl: number;
  profitFactor: number;
  sessions: number;
  isPositiveExpectancy: boolean;
}

export function computeExpectancy(trades: JournalEntry[]): ExpectancyStats {
  const closed = trades.filter((t) => t.status === "CLOSED" && t.pnl != null);
  const wins = closed.filter((t) => (t.pnl ?? 0) > 0);
  const losses = closed.filter((t) => (t.pnl ?? 0) <= 0);

  const winRate = closed.length > 0 ? wins.length / closed.length : 0;
  const avgWin =
    wins.length > 0 ? wins.reduce((s, t) => s + (t.pnl ?? 0), 0) / wins.length : 0;
  const avgLoss =
    losses.length > 0
      ? Math.abs(losses.reduce((s, t) => s + (t.pnl ?? 0), 0) / losses.length)
      : 0;

  const expectancy = winRate * avgWin - (1 - winRate) * avgLoss;
  const grossProfit = wins.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + (t.pnl ?? 0), 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

  const sessions = new Set(trades.map((t) => t.sessionDate)).size;

  return {
    totalTrades: trades.length,
    closedTrades: closed.length,
    openTrades: trades.filter((t) => t.status === "OPEN").length,
    winRate: round(winRate * 100),
    avgWin: round(avgWin),
    avgLoss: round(avgLoss),
    expectancy: round(expectancy),
    totalPnl: round(closed.reduce((s, t) => s + (t.pnl ?? 0), 0)),
    profitFactor: round(profitFactor === Infinity ? 999 : profitFactor),
    sessions,
    isPositiveExpectancy: expectancy > 0,
  };
}

export function getMonthlyRecords(trades: JournalEntry[], isLive: boolean): MonthlyRecord[] {
  const map = new Map<string, MonthlyRecord>();

  for (const trade of trades) {
    if (trade.status !== "CLOSED" || trade.pnl == null) continue;
    if (trade.isPaper === isLive) continue; // isPaper true means not live

    const month = trade.closedAt?.slice(0, 7) ?? trade.sessionDate.slice(0, 7);
    const existing = map.get(month) ?? { month, pnl: 0, trades: 0, isLive };
    existing.pnl += trade.pnl;
    existing.trades += 1;
    map.set(month, existing);
  }

  return [...map.values()].sort((a, b) => a.month.localeCompare(b.month));
}

export function countConsecutiveProfitableMonths(records: MonthlyRecord[]): number {
  const sorted = [...records].sort((a, b) => b.month.localeCompare(a.month));
  let count = 0;
  for (const r of sorted) {
    if (r.pnl > 0) count++;
    else break;
  }
  return count;
}

export function emotionBreakdown(trades: JournalEntry[]): Record<string, { count: number; pnl: number }> {
  const map: Record<string, { count: number; pnl: number }> = {};
  for (const t of trades) {
    if (t.status !== "CLOSED") continue;
    const e = map[t.emotion] ?? { count: 0, pnl: 0 };
    e.count += 1;
    e.pnl += t.pnl ?? 0;
    map[t.emotion] = e;
  }
  return map;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
