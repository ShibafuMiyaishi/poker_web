import { type Position, loadChart, normalizeHand, resolveMixedAction } from '@pokergo/gto-charts';
import type { Seat } from '@pokergo/shared';
import { type Rng, cryptoRng } from '../game/deck';
import { clockwiseSeats } from '../game/handLifecycle';
import type { HandState, PlayerAction } from '../game/types';
import { equityVsRandom } from './equity';
import type { CpuProfile } from './profile';

// HandState 上の seat にポジション名（UTG/MP/HJ/CO/BTN/SB/BB）を割り当てる。
export function derivePosition(state: HandState, seat: Seat): Position {
  const seatSet = new Set(state.players.keys());
  const order = clockwiseSeats(seatSet, state.buttonSeat);
  const idx = order.indexOf(seat);
  const n = order.length;
  if (n === 2) return idx === 0 ? 'BB' : 'BTN';
  if (idx === 0) return 'SB';
  if (idx === 1) return 'BB';
  const fromBtn = n - 1 - idx;
  if (fromBtn === 0) return 'BTN';
  if (fromBtn === 1) return 'CO';
  if (fromBtn === 2) return 'HJ';
  if (fromBtn === 3) return 'MP';
  if (fromBtn === 4) return 'UTG+1';
  return 'UTG';
}

export function decidePreflop(
  state: HandState,
  seat: Seat,
  profile: CpuProfile,
  rng: Rng = cryptoRng,
): PlayerAction {
  const player = state.players.get(seat);
  if (!player) throw new Error(`decidePreflop: seat ${seat} not in hand`);
  const position = derivePosition(state, seat);
  const handStr = normalizeHand(player.holeCards);
  const isFacingRaise = state.currentBet > state.bb;
  const openChart = loadChart(position, 'open');
  const chartCall = openChart[handStr] ?? 'fold';
  const decision = resolveMixedAction(chartCall, rng);

  if (!isFacingRaise) {
    // open 局面: チャート通りに raise/fold（SB/BB は call も検討）
    if (decision === 'raise') {
      return suggestPreflopRaise(state, seat, profile);
    }
    if (player.currentBet === state.currentBet) {
      return { seat, type: 'check' };
    }
    return { seat, type: 'fold' };
  }

  // vs raise: open 範囲のハンドは call、確定 raise（チャート上）の上位は 3bet
  if (decision === 'raise') {
    // 4-bet/3-bet をやるかは aggressiveness で確率調整。Phase 1 は通常 call に倒す。
    if (rng() < 0.3 * profile.aggressiveness) {
      return suggestPreflopRaise(state, seat, profile);
    }
    return wantsCallOrAllIn(state, seat);
  }
  // それ以外は fold
  if (player.currentBet === state.currentBet) return { seat, type: 'check' };
  return { seat, type: 'fold' };
}

export function decidePostflop(
  state: HandState,
  seat: Seat,
  profile: CpuProfile,
  rng: Rng = cryptoRng,
): PlayerAction {
  const player = state.players.get(seat);
  if (!player) throw new Error(`decidePostflop: seat ${seat} not in hand`);

  // 試行回数は速度優先で抑える。仕様 §10.1 では 1 万試行 100ms 目標だが CPU 推論はこれより軽くて良い。
  const equity = equityVsRandom(player.holeCards, state.board, 300, rng);
  const toCall = state.currentBet - player.currentBet;
  const canCheck = toCall === 0;
  const potOdds = toCall === 0 ? 0 : toCall / (state.pot + toCall);
  const strongThreshold = 0.7 / profile.aggressiveness;

  if (equity > strongThreshold) {
    if (canCheck) return suggestBet(state, seat, 0.66, profile);
    return suggestRaise(state, seat, profile);
  }

  if (equity > profile.callThresholdEquity) {
    if (canCheck) return { seat, type: 'check' };
    return wantsCallOrAllIn(state, seat);
  }

  // 半端なエクイティでもポットオッズが優位なら call
  if (!canCheck && equity > potOdds + 0.05) {
    return wantsCallOrAllIn(state, seat);
  }

  // 弱: 一定確率でブラフ
  if (canCheck && rng() < profile.bluffFreq) {
    return suggestBet(state, seat, 0.5, profile);
  }

  if (canCheck) return { seat, type: 'check' };
  return { seat, type: 'fold' };
}

export function decideAction(
  state: HandState,
  seat: Seat,
  profile: CpuProfile,
  rng: Rng = cryptoRng,
): PlayerAction {
  if (state.street === 'preflop') return decidePreflop(state, seat, profile, rng);
  return decidePostflop(state, seat, profile, rng);
}

// --- ヘルパー ---

function wantsCallOrAllIn(state: HandState, seat: Seat): PlayerAction {
  const player = state.players.get(seat);
  if (!player) throw new Error(`wantsCallOrAllIn: seat ${seat}`);
  const toCall = state.currentBet - player.currentBet;
  if (toCall === 0) return { seat, type: 'check' };
  if (toCall >= player.stack) return { seat, type: 'all_in' };
  return { seat, type: 'call' };
}

function suggestPreflopRaise(state: HandState, seat: Seat, profile: CpuProfile): PlayerAction {
  const player = state.players.get(seat);
  if (!player) throw new Error('suggestPreflopRaise: missing player');
  // open: 2.5bb 〜 3bb、vs raise: 3x previous raise
  const isFacingRaise = state.currentBet > state.bb;
  const target = isFacingRaise
    ? Math.floor(state.currentBet * 3 * profile.aggressiveness)
    : Math.floor(state.bb * 2.5 * profile.aggressiveness);
  return clampToBetOrAllIn(state, seat, target, 'raise');
}

function suggestBet(
  state: HandState,
  seat: Seat,
  fraction: number,
  profile: CpuProfile,
): PlayerAction {
  const player = state.players.get(seat);
  if (!player) throw new Error('suggestBet: missing player');
  const target = Math.max(state.bb, Math.floor(state.pot * fraction * profile.aggressiveness));
  return clampToBetOrAllIn(state, seat, player.currentBet + target, 'bet');
}

function suggestRaise(state: HandState, seat: Seat, profile: CpuProfile): PlayerAction {
  const player = state.players.get(seat);
  if (!player) throw new Error('suggestRaise: missing player');
  const target = Math.floor(state.currentBet * 3 * profile.aggressiveness);
  return clampToBetOrAllIn(state, seat, target, 'raise');
}

function clampToBetOrAllIn(
  state: HandState,
  seat: Seat,
  targetTotal: number,
  kind: 'bet' | 'raise',
): PlayerAction {
  const player = state.players.get(seat);
  if (!player) throw new Error('clampToBetOrAllIn: missing player');
  const maxTotal = player.currentBet + player.stack;
  const clamped = Math.min(targetTotal, maxTotal);
  if (clamped >= maxTotal) return { seat, type: 'all_in' };
  if (kind === 'raise') {
    const legalMin = state.currentBet + state.minRaise;
    if (clamped < legalMin) {
      // legal な raise を作れない → call
      return wantsCallOrAllIn(state, seat);
    }
  } else if (clamped <= state.currentBet) {
    return { seat, type: 'check' };
  }
  return { seat, type: kind, amount: clamped };
}
