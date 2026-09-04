"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { AppState, JournalEntry, PaperPosition, PhaseId, UserProfile } from "@/lib/journal-types";
import { loadState, resetState, saveState } from "@/lib/storage";
import { calculateTradeCosts } from "@/lib/costs";

interface TradingContextValue {
  state: AppState;
  openTrade: (trade: Omit<JournalEntry, "id" | "openedAt" | "status" | "costs">) => void;
  closeTrade: (id: string, exitPrice: number, exitReason: string) => void;
  deleteTrade: (id: string) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  toggleLearnItem: (moduleId: string) => void;
  completeSession: () => void;
  advancePhase: (phase: PhaseId) => void;
  resetAll: () => void;
}

const TradingContext = createContext<TradingContextValue | null>(null);

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function TradingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveState(state);
  }, [state, hydrated]);

  const openTrade = useCallback(
    (trade: Omit<JournalEntry, "id" | "openedAt" | "status" | "costs">) => {
      const value = trade.entryPrice * trade.quantity;
      const costs = calculateTradeCosts(value, value).total;

      setState((prev) => {
        const cash = trade.isPaper ? prev.profile.paperCash : prev.profile.liveCash;
        if (cash < value + costs) return prev;

        const entry: JournalEntry = {
          ...trade,
          id: uid(),
          openedAt: new Date().toISOString(),
          status: "OPEN",
          costs,
        };

        const profile = { ...prev.profile };
        if (trade.isPaper) profile.paperCash -= value + costs;
        else profile.liveCash -= value + costs;

        const positions = [...prev.positions];
        const existing = positions.find((p) => p.symbol === trade.symbol);
        if (existing) {
          const totalQty = existing.quantity + trade.quantity;
          existing.avgPrice =
            (existing.avgPrice * existing.quantity + trade.entryPrice * trade.quantity) / totalQty;
          existing.quantity = totalQty;
          existing.currentPrice = trade.entryPrice;
        } else {
          positions.push({
            symbol: trade.symbol,
            name: trade.name,
            quantity: trade.quantity,
            avgPrice: trade.entryPrice,
            currentPrice: trade.entryPrice,
          });
        }

        return { ...prev, profile, journal: [entry, ...prev.journal], positions };
      });
    },
    []
  );

  const closeTrade = useCallback((id: string, exitPrice: number, exitReason: string) => {
    setState((prev) => {
      const trade = prev.journal.find((t) => t.id === id);
      if (!trade || trade.status === "CLOSED") return prev;

      const sellValue = exitPrice * trade.quantity;
      const buyValue = trade.entryPrice * trade.quantity;
      const exitCosts = calculateTradeCosts(buyValue, sellValue).total;
      const grossPnl = (exitPrice - trade.entryPrice) * trade.quantity;
      const netPnl = grossPnl - trade.costs - exitCosts;
      const pnlPercent = buyValue > 0 ? (netPnl / buyValue) * 100 : 0;

      const profile = { ...prev.profile };
      if (trade.isPaper) profile.paperCash += sellValue - exitCosts;
      else profile.liveCash += sellValue - exitCosts;

      const positions = prev.positions
        .map((p) => {
          if (p.symbol !== trade.symbol) return p;
          return { ...p, quantity: p.quantity - trade.quantity };
        })
        .filter((p) => p.quantity > 0);

      const journal = prev.journal.map((t) =>
        t.id === id
          ? {
              ...t,
              exitPrice,
              exitReason,
              status: "CLOSED" as const,
              closedAt: new Date().toISOString(),
              pnl: Math.round(netPnl * 100) / 100,
              pnlPercent: Math.round(pnlPercent * 100) / 100,
              costs: t.costs + exitCosts,
            }
          : t
      );

      return { ...prev, profile, journal, positions };
    });
  }, []);

  const deleteTrade = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      journal: prev.journal.filter((t) => t.id !== id),
    }));
  }, []);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setState((prev) => ({
      ...prev,
      profile: { ...prev.profile, ...updates },
    }));
  }, []);

  const toggleLearnItem = useCallback((moduleId: string) => {
    setState((prev) => {
      const checklist = { ...prev.profile.learnChecklist };
      checklist[moduleId] = !checklist[moduleId];
      const completed = Object.values(checklist).filter(Boolean).length;
      const profile = { ...prev.profile, learnChecklist: checklist };
      if (completed >= 6 && !profile.phase1CompletedAt) {
        profile.phase1CompletedAt = new Date().toISOString();
      }
      return { ...prev, profile };
    });
  }, []);

  const completeSession = useCallback(() => {
    setState((prev) => {
      const todayStr = today();
      const hasTradeToday = prev.journal.some((t) => t.sessionDate === todayStr);
      if (!hasTradeToday) return prev;

      const sessions = new Set(prev.journal.map((t) => t.sessionDate));
      const alreadyCounted = prev.profile.phase2SessionsCompleted >= sessions.size;

      return {
        ...prev,
        profile: {
          ...prev.profile,
          phase2SessionsCompleted: alreadyCounted
            ? prev.profile.phase2SessionsCompleted
            : sessions.size,
          phase2StartedAt: prev.profile.phase2StartedAt ?? new Date().toISOString(),
        },
      };
    });
  }, []);

  const advancePhase = useCallback((phase: PhaseId) => {
    setState((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        currentPhase: phase,
        phase3StartedAt: phase === 3 ? new Date().toISOString() : prev.profile.phase3StartedAt,
      },
    }));
  }, []);

  const resetAll = useCallback(() => {
    setState(resetState());
  }, []);

  if (!hydrated) return null;

  return (
    <TradingContext.Provider
      value={{
        state,
        openTrade,
        closeTrade,
        deleteTrade,
        updateProfile,
        toggleLearnItem,
        completeSession,
        advancePhase,
        resetAll,
      }}
    >
      {children}
    </TradingContext.Provider>
  );
}

export function useTrading() {
  const ctx = useContext(TradingContext);
  if (!ctx) throw new Error("useTrading must be used within TradingProvider");
  return ctx;
}
