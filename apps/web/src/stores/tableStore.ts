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
  setState: (s: HandState | null) => void;
  setCpuNames: (m: Map<Seat, string>) => void;
  setYourSeat: (s: Seat) => void;
  setStatus: (s: Status) => void;
  setShowdown: (w: WinAllocation[] | null, revealed: boolean) => void;
  setAnalysis: (a: HandAnalysis | null) => void;
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
  setState: (s) => set({ state: s }),
  setCpuNames: (m) => set({ cpuNames: new Map(m) }),
  setYourSeat: (s) => set({ yourSeat: s }),
  setStatus: (s) => set({ status: s }),
  setShowdown: (w, revealed) => set({ winners: w, showdownRevealed: revealed }),
  setAnalysis: (a) => set({ analysis: a }),
  incrementHandsPlayed: () => set((s) => ({ handsPlayed: s.handsPlayed + 1 })),
}));

// 自分のホールカードを取得
export function selectYourHoleCards(s: TableStore): [Card, Card] | null {
  if (!s.state) return null;
  const p = s.state.players.get(s.yourSeat);
  return p?.holeCards ?? null;
}
