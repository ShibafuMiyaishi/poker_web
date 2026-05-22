import type { ActionType, Card, Seat, Street } from '@pokergo/shared';

export type PlayerStatus = 'active' | 'folded' | 'allin';

export interface HandPlayer {
  seat: Seat;
  startStack: number;
  stack: number;
  holeCards: [Card, Card];
  status: PlayerStatus;
  contribution: number;
  currentBet: number;
  hasActedSinceLastRaise: boolean;
}

export interface ActionEntry {
  seat: Seat;
  street: Street;
  type: ActionType;
  amount: number;
  potBefore: number;
}

export interface HandState {
  handId: string;
  street: Street;
  board: Card[];
  players: Map<Seat, HandPlayer>;
  buttonSeat: Seat;
  sb: number;
  bb: number;
  pot: number;
  currentBet: number;
  minRaise: number;
  lastRaiser: Seat | null;
  toAct: Seat | null;
  deck: Card[];
  actions: ActionEntry[];
}

export type PlayerAction =
  | { seat: Seat; type: 'fold' }
  | { seat: Seat; type: 'check' }
  | { seat: Seat; type: 'call' }
  | { seat: Seat; type: 'bet'; amount: number }
  | { seat: Seat; type: 'raise'; amount: number }
  | { seat: Seat; type: 'all_in' };

export interface LegalAction {
  type: ActionType;
  minAmount?: number;
  maxAmount?: number;
}

export interface WinAllocation {
  seat: Seat;
  amount: number;
  potLabel: string;
}
