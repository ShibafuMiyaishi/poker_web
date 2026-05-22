import type { Card, Seat } from '@pokergo/shared';
import type { HandState, WinAllocation } from '../game/types';

// クライアント → API → D1 へ送る正規化ペイロード。
// D1 スキーマ (apps/api/migrations/0001_init.sql) と対応。

export interface HandPayloadHand {
  id: string;
  tableId: string;
  handNo: number;
  startedAt: number; // ms epoch
  endedAt: number;
  sb: number;
  bb: number;
  buttonSeat: Seat;
  board: string; // "Ah Kd 9s 2c 7h" 形式
  potTotal: number;
  rake: number;
  pokerstarsText: string;
}

export interface HandPayloadPlayer {
  userId: string | null;
  cpuName: string | null;
  seatNo: Seat;
  position: string;
  holeCards: string; // "Ah Kd"
  stackStart: number;
  stackEnd: number;
  netChips: number;
  wentToShowdown: boolean;
  won: boolean;
}

export interface HandPayloadAction {
  id: string;
  street: string;
  seatNo: Seat;
  orderNo: number;
  actionType: string;
  amount: number;
  potBefore: number;
  stackBefore: number;
  ts: number;
  toCallBefore: number;
}

export interface HandPayload {
  hand: HandPayloadHand;
  players: HandPayloadPlayer[];
  actions: HandPayloadAction[];
}

export interface BuildPayloadOpts {
  tableId: string;
  handNo: number;
  startedAt: number;
  endedAt: number;
  pokerstarsText: string;
  seatLabel: (seat: Seat) => { userId: string | null; cpuName: string | null; position: string };
  winners: WinAllocation[];
}

export function buildHandPayload(state: HandState, opts: BuildPayloadOpts): HandPayload {
  const winnerBySeat = new Map<Seat, number>();
  for (const w of opts.winners) {
    winnerBySeat.set(w.seat, (winnerBySeat.get(w.seat) ?? 0) + w.amount);
  }

  const players: HandPayloadPlayer[] = [];
  for (const p of state.players.values()) {
    const label = opts.seatLabel(p.seat);
    const won = (winnerBySeat.get(p.seat) ?? 0) > 0;
    const netChips = p.stack - p.startStack + (winnerBySeat.get(p.seat) ?? 0);
    players.push({
      userId: label.userId,
      cpuName: label.cpuName,
      seatNo: p.seat,
      position: label.position,
      holeCards: p.holeCards.join(' '),
      stackStart: p.startStack,
      stackEnd: p.stack + (winnerBySeat.get(p.seat) ?? 0),
      netChips,
      wentToShowdown: p.status !== 'folded',
      won,
    });
  }

  const actions: HandPayloadAction[] = state.actions.map((a, idx) => ({
    id: `${opts.tableId}-${opts.handNo}-${idx}`,
    street: a.street,
    seatNo: a.seat,
    orderNo: idx,
    actionType: a.type,
    amount: a.amount,
    potBefore: a.potBefore,
    // stackBefore はストリート開始時の actor のスタックを再構築する必要があるが MVP では 0
    stackBefore: 0,
    ts: opts.startedAt + idx * 1000,
    toCallBefore: a.toCallBefore,
  }));

  return {
    hand: {
      id: state.handId,
      tableId: opts.tableId,
      handNo: opts.handNo,
      startedAt: opts.startedAt,
      endedAt: opts.endedAt,
      sb: state.sb,
      bb: state.bb,
      buttonSeat: state.buttonSeat,
      board: state.board.join(' '),
      potTotal: opts.winners.reduce((sum, w) => sum + w.amount, 0),
      rake: 0,
      pokerstarsText: opts.pokerstarsText,
    },
    players,
    actions,
  };
}

export type CardString = Card;
