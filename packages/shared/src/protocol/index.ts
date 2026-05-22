// WebSocket プロトコル型。仕様 §7.2 と同期。
// type フィールドで discriminated union。サーバー・クライアント両端で同一型を使う。

import type { ActionType, Card, Seat, Street } from '../types/index';

// --- Client → Server ---

export type ClientMessage =
  | { type: 'subscribe' }
  | { type: 'action'; action: ActionType; amount?: number }
  | { type: 'sit'; seatNo: Seat }
  | { type: 'leave' }
  | { type: 'ping' };

// --- Server → Client ---

export type ServerMessage =
  | { type: 'state'; state: TableSnapshot }
  | {
      type: 'action';
      seatNo: Seat;
      action: ActionType;
      amount: number;
      newPot: number;
      toAct: Seat | null;
      deadline: number;
    }
  | { type: 'street'; street: Street; board: Card[] }
  | {
      type: 'hand_start';
      handId: string;
      button: Seat;
      sb: number;
      bb: number;
      yourCards: [Card, Card] | null;
    }
  | {
      type: 'hand_end';
      winners: Array<{ seatNo: Seat; amount: number }>;
      showdown: ShowdownEntry[];
      analysis: HandAnalysis;
    }
  | { type: 'error'; code: string; message: string };

export interface TableSnapshot {
  seats: SeatView[];
  handState: HandStateView | null;
  yourSeat: Seat | null;
}

export interface SeatView {
  seatNo: Seat;
  occupiedBy:
    | { type: 'human'; userId: string; handle: string }
    | { type: 'cpu'; cpuId: string; name: string }
    | null;
  stack: number;
  sittingOut: boolean;
}

export interface HandStateView {
  handId: string;
  street: Street;
  board: Card[];
  pot: number;
  currentBet: number;
  toAct: Seat | null;
  deadline: number;
}

export interface ShowdownEntry {
  seatNo: Seat;
  cards: [Card, Card];
  handRank: string;
}

export interface HandAnalysis {
  actions: Array<{
    street: Street;
    action: ActionType;
    equityPct: number;
    potOddsPct: number;
    evActionBb: number;
    evBestBb: number;
    bestAction: ActionType;
  }>;
}
