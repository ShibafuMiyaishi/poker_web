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
  // サーバ → クライアントは WireHandState（JSON 互換、players は array tuple）。
  // 旧 HandStateView は使用しない（後方互換のため型定義は残置）。
  handState: WireHandState | null;
  yourSeat: Seat | null;
}

// engine の HandState を JSON 互換に変換したもの。players の Map と deck を
// JSON.stringify できる形に直してある。クライアント側で handStateFromWire(...) で復元する。
export interface WireHandPlayer {
  seat: Seat;
  startStack: number;
  stack: number;
  holeCards: [Card, Card]; // 他席は ['??', '??']
  status: 'active' | 'folded' | 'allin';
  contribution: number;
  currentBet: number;
  hasActedSinceLastRaise: boolean;
}

export interface WireActionEntry {
  seat: Seat;
  street: Street;
  type: ActionType;
  amount: number;
  potBefore: number;
  toCallBefore: number;
}

export interface WireHandState {
  handId: string;
  street: Street;
  board: Card[];
  players: Array<[Seat, WireHandPlayer]>;
  buttonSeat: Seat;
  sb: number;
  bb: number;
  pot: number;
  currentBet: number;
  minRaise: number;
  lastRaiser: Seat | null;
  toAct: Seat | null;
  actions: WireActionEntry[];
  // deck は絶対送らない
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
