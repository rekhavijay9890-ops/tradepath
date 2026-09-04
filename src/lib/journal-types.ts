export type PhaseId = 1 | 2 | 3 | 4;

export type TradeType = "INTRADAY" | "DELIVERY";
export type TradeSide = "BUY" | "SELL";
export type TradeStatus = "OPEN" | "CLOSED";
export type Emotion =
  | "CALM"
  | "CONFIDENT"
  | "FEARFUL"
  | "FOMO"
  | "REVENGE"
  | "ANXIOUS"
  | "GREEDY";

export type Strategy =
  | "ORB"
  | "VWAP_RECLAIM"
  | "MOMENTUM"
  | "GAP_FADE"
  | "SWING"
  | "OTHER";

export interface JournalEntry {
  id: string;
  symbol: string;
  name: string;
  side: TradeSide;
  type: TradeType;
  strategy: Strategy;
  quantity: number;
  entryPrice: number;
  exitPrice?: number;
  stopLoss?: number;
  target?: number;
  entryReason: string;
  exitReason?: string;
  emotion: Emotion;
  status: TradeStatus;
  isPaper: boolean;
  sessionDate: string;
  openedAt: string;
  closedAt?: string;
  costs: number;
  pnl?: number;
  pnlPercent?: number;
}

export interface PaperPosition {
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
}

export interface MonthlyRecord {
  month: string; // YYYY-MM
  pnl: number;
  trades: number;
  isLive: boolean;
}

export interface UserProfile {
  currentPhase: PhaseId;
  phase1CompletedAt?: string;
  phase2SessionsCompleted: number;
  phase2StartedAt?: string;
  paperCapital: number;
  paperCash: number;
  liveCapital: number;
  liveCash: number;
  riskPercent: number;
  activeStrategy: Strategy;
  phase3StartedAt?: string;
  monthlyRecords: MonthlyRecord[];
  learnChecklist: Record<string, boolean>;
}

export interface AppState {
  profile: UserProfile;
  journal: JournalEntry[];
  positions: PaperPosition[];
  version: number;
}

export const DEFAULT_PROFILE: UserProfile = {
  currentPhase: 1,
  phase2SessionsCompleted: 0,
  paperCapital: 100_000,
  paperCash: 100_000,
  liveCapital: 50_000,
  liveCash: 50_000,
  riskPercent: 1,
  activeStrategy: "ORB",
  monthlyRecords: [],
  learnChecklist: {},
};

export const DEFAULT_STATE: AppState = {
  profile: DEFAULT_PROFILE,
  journal: [],
  positions: [],
  version: 1,
};
