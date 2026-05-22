import type { Seat } from '@pokergo/shared';
import { nextOccupiedSeat } from './handLifecycle';
import type { HandPlayer, HandState, LegalAction, PlayerAction } from './types';

export function legalActions(state: HandState, seat: Seat): LegalAction[] {
  if (state.toAct !== seat) return [];
  const player = state.players.get(seat);
  if (!player || player.status !== 'active') return [];

  const result: LegalAction[] = [{ type: 'fold' }];

  if (player.currentBet === state.currentBet) {
    result.push({ type: 'check' });
  } else {
    result.push({ type: 'call' });
  }

  if (player.stack > 0) {
    if (state.currentBet === 0) {
      const min = state.bb;
      const max = player.currentBet + player.stack;
      if (max >= min) result.push({ type: 'bet', minAmount: min, maxAmount: max });
    } else {
      const minRaiseTotal = state.currentBet + state.minRaise;
      const maxRaiseTotal = player.currentBet + player.stack;
      if (maxRaiseTotal >= minRaiseTotal) {
        result.push({ type: 'raise', minAmount: minRaiseTotal, maxAmount: maxRaiseTotal });
      }
    }
    result.push({ type: 'all_in' });
  }

  return result;
}

export function isBettingRoundComplete(state: HandState): boolean {
  return state.toAct === null;
}

export function applyAction(state: HandState, action: PlayerAction): HandState {
  if (state.toAct === null) throw new Error('applyAction: no actor expected');
  if (state.toAct !== action.seat) {
    throw new Error(`applyAction: not seat ${action.seat}'s turn (expected ${state.toAct})`);
  }
  const cur = state.players.get(action.seat);
  if (!cur) throw new Error(`applyAction: seat ${action.seat} not in hand`);
  if (cur.status !== 'active') {
    throw new Error(`applyAction: seat ${action.seat} status is ${cur.status}`);
  }

  const next = structuredClone(state);
  const p = next.players.get(action.seat);
  if (!p) throw new Error('applyAction: cloned player missing');
  const potBefore = next.pot;
  let recordedAmount = 0;

  switch (action.type) {
    case 'fold': {
      p.status = 'folded';
      p.hasActedSinceLastRaise = true;
      break;
    }

    case 'check': {
      if (p.currentBet !== next.currentBet) {
        throw new Error(
          `applyAction: cannot check (facing ${next.currentBet}, your bet ${p.currentBet})`,
        );
      }
      p.hasActedSinceLastRaise = true;
      break;
    }

    case 'call': {
      const toCall = next.currentBet - p.currentBet;
      if (toCall <= 0) throw new Error('applyAction: nothing to call');
      const actual = Math.min(toCall, p.stack);
      p.stack -= actual;
      p.currentBet += actual;
      p.contribution += actual;
      next.pot += actual;
      if (p.stack === 0) p.status = 'allin';
      p.hasActedSinceLastRaise = true;
      recordedAmount = actual;
      break;
    }

    case 'bet':
    case 'raise': {
      const target = action.amount;
      const delta = target - p.currentBet;
      if (delta <= 0) throw new Error('applyAction: bet/raise must increase your bet');
      if (delta > p.stack) throw new Error('applyAction: bet/raise exceeds stack');
      if (target <= next.currentBet) {
        throw new Error(
          `applyAction: ${action.type} ${target} must exceed current bet ${next.currentBet}`,
        );
      }
      const raiseDelta = target - next.currentBet;
      const isAllIn = delta === p.stack;
      if (raiseDelta < next.minRaise && !isAllIn) {
        throw new Error(
          `applyAction: raise too small (delta ${raiseDelta} < minRaise ${next.minRaise})`,
        );
      }

      p.stack -= delta;
      p.currentBet = target;
      p.contribution += delta;
      next.pot += delta;
      if (p.stack === 0) p.status = 'allin';

      next.currentBet = target;
      if (raiseDelta >= next.minRaise) {
        next.minRaise = raiseDelta;
        // full raise はアクションを再オープン
        for (const other of next.players.values()) {
          if (other.seat !== action.seat && other.status === 'active') {
            other.hasActedSinceLastRaise = false;
          }
        }
      }
      next.lastRaiser = action.seat;
      p.hasActedSinceLastRaise = true;
      // amount は「このアクションでポットに追加したチップ数」(delta) で統一
      recordedAmount = delta;
      break;
    }

    case 'all_in': {
      const delta = p.stack;
      if (delta === 0) throw new Error('applyAction: cannot all-in with zero stack');
      const allInTotal = p.currentBet + delta;
      const raiseDelta = allInTotal - next.currentBet;

      p.stack = 0;
      p.currentBet = allInTotal;
      p.contribution += delta;
      next.pot += delta;
      p.status = 'allin';

      if (allInTotal > next.currentBet) {
        next.currentBet = allInTotal;
        if (raiseDelta >= next.minRaise) {
          next.minRaise = raiseDelta;
          for (const other of next.players.values()) {
            if (other.seat !== action.seat && other.status === 'active') {
              other.hasActedSinceLastRaise = false;
            }
          }
        }
        next.lastRaiser = action.seat;
      }
      p.hasActedSinceLastRaise = true;
      recordedAmount = delta;
      break;
    }
  }

  next.actions.push({
    seat: action.seat,
    street: state.street,
    type: action.type,
    amount: recordedAmount,
    potBefore,
  });

  next.toAct = computeNextToAct(next, action.seat);
  if (next.toAct === null) refundUncalledBet(next);

  return next;
}

function computeNextToAct(state: HandState, lastActor: Seat): Seat | null {
  const nonFolded = [...state.players.values()].filter((p) => p.status !== 'folded');
  if (nonFolded.length <= 1) return null;

  const seatSet = new Set(state.players.keys());
  let cur: Seat = lastActor;
  for (let i = 0; i < 8; i++) {
    cur = nextOccupiedSeat(seatSet, cur);
    const p = state.players.get(cur);
    if (!p || p.status !== 'active') continue;
    if (!p.hasActedSinceLastRaise || p.currentBet < state.currentBet) {
      return cur;
    }
    if (cur === lastActor) break; // 一周
  }
  return null;
}

// betting round 終了時、誰もコールできなかった上乗せ分を返却する
function refundUncalledBet(state: HandState): void {
  const nonFolded = [...state.players.values()].filter((p) => p.status !== 'folded');
  if (nonFolded.length < 2) return; // 1 人勝ち → settlement が pot 全額授与

  const sorted = [...nonFolded].sort((a, b) => b.currentBet - a.currentBet);
  const highest = sorted[0];
  const second = sorted[1];
  if (!highest || !second) return;
  if (highest.currentBet <= second.currentBet) return;

  const excess = highest.currentBet - second.currentBet;
  highest.stack += excess;
  highest.currentBet -= excess;
  highest.contribution -= excess;
  state.pot -= excess;
}

export function ensureNoActor(state: HandState): void {
  if (state.toAct !== null) throw new Error('ensureNoActor: action still pending');
}

// 内部実装の単体テスト用に export しておく
export const internals = { computeNextToAct, refundUncalledBet };

// HandPlayer は外部から触らないが TS の readonly 利便用に re-export
export type { HandPlayer };
