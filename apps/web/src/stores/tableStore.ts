import type { HandAnalysis, HandState, WinAllocation } from '@pokergo/engine';
import type { Card, Seat } from '@pokergo/shared';
import { create } from 'zustand';

export type Status = 'idle' | 'playing' | 'between_hands';

interface TableStore {
  state: HandState | null;
  yourSeat: Seat;
  cpuNames: Map<Seat, string>;
  showdownRevealed: boolean;
  winners: WinAllocation[] | null;
  analysis: HandAnalysis | null;
  status: Status;
  handsPlayed: number;
  actionDeadline: number | null; // ms epoch、null = タイマー無し
  actionTotalMs: number; // 該当アクション期限の総時間（ms）
  setState: (s: HandState | null) => void;
  setCpuNames: (m: Map<Seat, string>) => void;
  setYourSeat: (s: Seat) => void;
  setStatus: (s: Status) => void;
  setShowdown: (w: WinAllocation[] | null, revealed: boolean) => void;
  setAnalysis: (a: HandAnalysis | null) => void;
  setActionDeadline: (deadlineMs: number | null, totalMs: number) => void;
  incrementHandsPlayed: () => void;
}

export const useTableStore = create<TableStore>((set) => ({
  state: null,
  yourSeat: 0 as Seat,
  cpuNames: new Map(),
  showdownRevealed: false,
  winners: null,
  analysis: null,
  status: 'idle',
  handsPlayed: 0,
  actionDeadline: null,
  actionTotalMs: 0,
  setState: (s) => set({ state: s }),
  setCpuNames: (m) => set({ cpuNames: new Map(m) }),
  setYourSeat: (s) => set({ yourSeat: s }),
  setStatus: (s) => set({ status: s }),
  setShowdown: (w, revealed) => set({ winners: w, showdownRevealed: revealed }),
  setAnalysis: (a) => set({ analysis: a }),
  setActionDeadline: (deadlineMs, totalMs) =>
    set({ actionDeadline: deadlineMs, actionTotalMs: totalMs }),
  incrementHandsPlayed: () => set((s) => ({ handsPlayed: s.handsPlayed + 1 })),
}));

// 自分のホールカードを取得
export function selectYourHoleCards(s: TableStore): [Card, Card] | null {
  if (!s.state) return null;
  const p = s.state.players.get(s.yourSeat);
  return p?.holeCards ?? null;
}
