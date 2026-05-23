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

// シナリオを HandState.currentBet とプリフロアクション数で判定する。
function derivePreflopScenario(state: HandState): 'open' | 'vs-raise' | 'vs-3bet' {
  const raiseCount = state.actions.filter(
    (a) =>
      a.street === 'preflop' && (a.type === 'raise' || a.type === 'bet' || a.type === 'all_in'),
  ).length;
  if (raiseCount === 0) return 'open';
  if (raiseCount === 1) return 'vs-raise';
  return 'vs-3bet';
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
  const scenario = derivePreflopScenario(state);
  const chart = loadChart(position, scenario);
  const chartCall = chart[handStr] ?? 'fold';
  const decision = resolveMixedAction(chartCall, rng);

  if (scenario === 'open') {
    if (decision === 'raise') return suggestPreflopRaise(state, seat, profile);
    if (decision === 'call') return wantsCallOrAllIn(state, seat);
    if (player.currentBet === state.currentBet) return { seat, type: 'check' };
    return { seat, type: 'fold' };
  }

  // vs-raise / vs-3bet: チャートに従って raise (3-bet/4-bet) / call / fold
  if (decision === 'raise') return suggestPreflopRaise(state, seat, profile);
  if (decision === 'call') return wantsCallOrAllIn(state, seat);
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

  // 試行回数を 300 → 600 に増やしてノイズ軽減（CPU 行動が安定）。
  const equity = equityVsRandom(player.holeCards, state.board, 600, rng);
  const toCall = state.currentBet - player.currentBet;
  const canCheck = toCall === 0;
  const potOdds = toCall === 0 ? 0 : toCall / (state.pot + toCall);
  // strongThreshold は 0.72 を下限・0.92 を上限にクランプ（極端な over-bet を抑制）
  const strongThreshold = Math.max(0.72, Math.min(0.92, 0.78 / profile.aggressiveness));

  if (equity > strongThreshold) {
    // 強いハンドでもサイズは 1/2 〜 2/3 pot に抑える（無茶な all-in を避ける）
    const fraction = 0.5 + 0.15 * Math.min(1, profile.aggressiveness - 0.9);
    if (canCheck) return suggestBet(state, seat, Math.max(0.4, fraction), profile);
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

  // 弱: ブラフは大幅に抑え、checkable な状況でのみ・低頻度で
  if (canCheck && rng() < profile.bluffFreq * 0.5) {
    return suggestBet(state, seat, 0.45, profile);
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
  // open: 2.2-2.5bb、vs raise: 2.5-3x (より控えめに調整、過剰な escalation を防止)
  const isFacingRaise = state.currentBet > state.bb;
  const target = isFacingRaise
    ? Math.floor(state.currentBet * (2.5 + 0.2 * (profile.aggressiveness - 1)))
    : Math.floor(state.bb * (2.3 + 0.2 * (profile.aggressiveness - 1)));
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
  // ポストフロップの raise は 2.2-2.8x（暴走防止）
  const multiplier = 2.2 + 0.4 * Math.min(1, Math.max(0, profile.aggressiveness - 0.9));
  const target = Math.floor(state.currentBet * multiplier);
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
