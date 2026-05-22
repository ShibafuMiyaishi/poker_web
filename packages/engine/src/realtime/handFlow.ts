import type { Seat } from '@pokergo/shared';
import { decideAction } from '../ai/decide';
import { CPU_PROFILES, type CpuName } from '../ai/profile';
import { applyAction } from '../game/actions';
import { type Rng, cryptoRng } from '../game/deck';
import { advanceStreet, isHandOver, startHand } from '../game/handLifecycle';
import { settleHand } from '../game/settle';
import type { HandState, PlayerAction, WinAllocation } from '../game/types';
import type { TableState } from './types';

// 着席中の participant を集めて HandState を作る。
export function startTableHand(state: TableState, opts: { handNo: number }): TableState {
  const participants: { seat: Seat; stack: number }[] = [];
  for (const s of state.seats) {
    if (s.occupiedBy && !s.sittingOut && s.stack >= state.config.bb) {
      participants.push({ seat: s.seatNo, stack: s.stack });
    }
  }
  if (participants.length < 2) return state;

  let buttonSeat = state.buttonSeat;
  if (!participants.some((p) => p.seat === buttonSeat)) {
    buttonSeat = participants[0]?.seat ?? (0 as Seat);
  }

  const hand = startHand({
    handId: `${state.tableId}-h${opts.handNo}`,
    participants,
    buttonSeat,
    sb: state.config.sb,
    bb: state.config.bb,
  });

  return { ...state, currentHand: hand, buttonSeat, handNo: opts.handNo };
}

export type AdvanceEvent =
  | { type: 'action_applied'; seat: Seat; action: PlayerAction; newPot: number; toAct: Seat | null }
  | { type: 'street_advanced'; street: string; board: string[] };

// 「次の human の手番」または「ハンド終了」まで CPU を進める。
// CPU の思考遅延は呼び出し側 (DO) で `setAlarm` 等を使って演出する。
export function advanceUntilHumanOrEnd(
  state: TableState,
  rng: Rng = cryptoRng,
): { state: TableState; events: AdvanceEvent[] } {
  if (!state.currentHand) return { state, events: [] };
  let hand: HandState = state.currentHand;
  const events: AdvanceEvent[] = [];
  let guard = 0;

  while (!isHandOver(hand) && guard < 400) {
    guard += 1;
    if (hand.toAct === null) {
      hand = advanceStreet(hand);
      events.push({ type: 'street_advanced', street: hand.street, board: [...hand.board] });
      continue;
    }
    const seat = hand.toAct;
    const occupant = state.seats[seat]?.occupiedBy;
    if (!occupant || occupant.type === 'human') break;

    const profile = CPU_PROFILES[occupant.name as CpuName] ?? CPU_PROFILES.Bravo;
    const action = decideAction(hand, seat, profile, rng);
    hand = applyAction(hand, action);
    events.push({
      type: 'action_applied',
      seat,
      action,
      newPot: hand.pot,
      toAct: hand.toAct,
    });
  }

  // ハンドが終了している場合のみ showdown まで補填する（人間の手番で止まったときは進めない）
  if (isHandOver(hand)) {
    while (hand.street !== 'showdown' && guard < 410) {
      guard += 1;
      hand = advanceStreet(hand);
      events.push({ type: 'street_advanced', street: hand.street, board: [...hand.board] });
    }
  }

  return { state: { ...state, currentHand: hand }, events };
}

// human のアクションを適用する。toAct が一致しない場合は throw。
export function applyHumanAction(
  state: TableState,
  seat: Seat,
  action: PlayerAction,
): { state: TableState; newPot: number; toAct: Seat | null } {
  if (!state.currentHand) throw new Error('applyHumanAction: no hand in progress');
  if (state.currentHand.toAct !== seat) {
    throw new Error(`applyHumanAction: not seat ${seat}'s turn`);
  }
  const updated = applyAction(state.currentHand, action);
  return {
    state: { ...state, currentHand: updated },
    newPot: updated.pot,
    toAct: updated.toAct,
  };
}

export interface SettleResult {
  state: TableState;
  finishedHand: HandState;
  winners: WinAllocation[];
}

// ハンド終了処理: 勝者にチップを配り、ボタン進行、currentHand クリア。
export function settleTableHand(state: TableState): SettleResult | null {
  if (!state.currentHand) return null;
  const finishedHand = state.currentHand;
  const winners = settleHand(finishedHand);

  const seats = state.seats.map((s) => {
    const handPlayer = finishedHand.players.get(s.seatNo);
    if (!handPlayer) return s;
    const won = winners.filter((w) => w.seat === s.seatNo).reduce((sum, w) => sum + w.amount, 0);
    return { ...s, stack: handPlayer.stack + won };
  });

  // 次の participant にボタンを移す
  let nextButton = state.buttonSeat;
  for (let i = 1; i <= 8; i++) {
    const cand = ((state.buttonSeat + i) % 8) as Seat;
    const seatRow = seats[cand];
    if (seatRow?.occupiedBy && seatRow.stack >= state.config.bb) {
      nextButton = cand;
      break;
    }
  }

  return {
    state: { ...state, seats, currentHand: null, buttonSeat: nextButton },
    finishedHand,
    winners,
  };
}
