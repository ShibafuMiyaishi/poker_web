import type { ActionType, Card, Seat, Street } from '@pokergo/shared';
import type { HandState } from '../game/types';
import { type BoardTextureTag, classifyBoard } from './boardTexture';
import { type BestActionDecision, compareEv } from './ev';
import { computeAdvancedEv } from './evAdvanced';
import { estimateFoldEquity } from './foldEquity';
import { gtoMatch } from './gtoMatch';
import { classifyHandCategory } from './handCategory';
import { summarizeRange } from './handRange';
import { countOuts } from './outs';
import { computeRequiredEquity } from './potOdds';
import { estimateVillainRange } from './rangeEstimator';
import type { HandCategory, OutsBreakdown, Verdict } from './types';
import { generateVerdict } from './verdict';

export interface ActionAnalysis {
  orderNo: number; // state.actions におけるグローバル順序 (D1 actions.order_no と一致)
  street: Street;
  action: ActionType;
  amount: number;
  toCallBefore: number;
  potBefore: number;
  equityPct: number; // 0-100
  requiredEquityPct: number | null; // toCallBefore === 0 のときは null
  bestAction: ActionType;
  takenEvBb: number | null; // bet/raise/all_in 採用時は null
  bestEvBb: number;
  deviationBb: number | null;
  gtoMatch: boolean | null; // postflop および vs-raise は null
  boardTexture: BoardTextureTag[] | null; // preflop は null
  // --- v2 行動評価エンジン拡張 ---
  handCategory?: HandCategory | undefined;
  estimatedVillainRange?: string | undefined;
  equityVsRangePct?: number | undefined;
  outsBreakdown?: OutsBreakdown | undefined;
  foldEquity?: number | undefined;
  evBetBb?: number | null | undefined;
  evRaiseBb?: number | null | undefined;
  impliedOddsBonusBb?: number | undefined;
  verdict?: Verdict | undefined;
  reasoning?: string[] | undefined;
}

export interface HandAnalysis {
  handId: string;
  yourSeat: Seat;
  actions: ActionAnalysis[];
}

export type EquityFn = (
  hero: readonly [Card, Card],
  board: readonly Card[],
  numOpponents: number,
) => Promise<number>;

// villain 推定レンジに対するエクイティ計算 (optional)。
// 渡されない場合は equityVsRandom の値を equityVsRange の代用とする。
export type EquityVsRangeFn = (
  hero: readonly [Card, Card],
  board: readonly Card[],
  range: import('./types').HandRange,
) => Promise<number>;

// 完了した HandState から自分の各アクションを分析する。
// equity 計算は injection（Web Worker など）で渡す。
export async function analyzeHand(
  state: HandState,
  yourSeat: Seat,
  equityFn: EquityFn,
  equityVsRangeFn?: EquityVsRangeFn,
): Promise<HandAnalysis> {
  const player = state.players.get(yourSeat);
  if (!player) {
    return { handId: state.handId, yourSeat, actions: [] };
  }

  const actions: ActionAnalysis[] = [];
  for (let idx = 0; idx < state.actions.length; idx++) {
    const entry = state.actions[idx];
    if (!entry || entry.seat !== yourSeat) continue;
    const boardAtPoint = boardAtStreet(state.board, entry.street);
    const numOpponents = countActiveOpponents(state, entry, yourSeat);
    const equity = await equityFn(player.holeCards, boardAtPoint, numOpponents);
    const requiredEq =
      entry.toCallBefore > 0 ? computeRequiredEquity(entry.toCallBefore, entry.potBefore) : null;
    const ev: BestActionDecision = compareEv(
      entry.type,
      equity,
      entry.toCallBefore,
      entry.potBefore,
      state.bb,
    );

    const isPreflop = entry.street === 'preflop';
    const match = isPreflop ? gtoMatch(state, yourSeat, entry) : null;
    const texture = isPreflop ? null : classifyBoard(boardAtPoint);

    // --- v2 拡張: ハンドカテゴリ / villain レンジ / advanced EV / verdict ---
    const handCategory = classifyHandCategory(player.holeCards, boardAtPoint);
    // 代表 villain (最も最近 active な opponent) を選んでレンジ推定
    const villainSeat = pickPrimaryVillain(state, entry, yourSeat);
    const villainRange =
      villainSeat !== null
        ? estimateVillainRange(state, villainSeat, [...player.holeCards, ...boardAtPoint])
        : null;
    const equityVsRange =
      villainRange && equityVsRangeFn
        ? await equityVsRangeFn(player.holeCards, boardAtPoint, villainRange)
        : equity;
    const outs =
      !isPreflop && boardAtPoint.length <= 4
        ? countOuts(player.holeCards, boardAtPoint, villainRange ?? {}, [])
        : null;
    const isBettingAction =
      entry.type === 'bet' || entry.type === 'raise' || entry.type === 'all_in';
    const foldEq =
      !isPreflop && isBettingAction && villainRange
        ? estimateFoldEquity(
            entry.amount,
            entry.potBefore,
            villainRange,
            boardAtPoint,
            entry.street,
            [...player.holeCards, ...boardAtPoint],
          )
        : 0;
    const adv = computeAdvancedEv({
      equityVsRange,
      toCallBefore: entry.toCallBefore,
      potBefore: entry.potBefore,
      heroStack: player.stack + entry.amount, // entry 時点のスタック近似 (chip 額)
      bb: state.bb,
      foldEquity: foldEq,
      handCategory,
      street: entry.street,
      outs,
    });
    const verdictResult = generateVerdict({
      taken: entry.type,
      bestAction: ev.bestAction,
      deviationBb: ev.deviationBb,
      takenEvBb: ev.takenEvBb,
      bestEvBb: Math.max(ev.bestEvBb, adv.bestEvBb),
      gtoMatch: match,
      handCategory,
      equityPct: equity * 100,
      equityVsRangePct: equityVsRange * 100,
      requiredEquityPct: requiredEq !== null ? requiredEq * 100 : null,
      foldEquity: isBettingAction ? foldEq : null,
      street: entry.street,
      potBefore: entry.potBefore,
      toCallBefore: entry.toCallBefore,
      bb: state.bb,
      heroStack: player.stack + entry.amount,
      outs,
      evBetBb: adv.evBetBb,
      evRaiseBb: adv.evRaiseBb,
      impliedOddsBonusBb: adv.impliedOddsBonusBb,
    });

    actions.push({
      orderNo: idx,
      street: entry.street,
      action: entry.type,
      amount: entry.amount,
      toCallBefore: entry.toCallBefore,
      potBefore: entry.potBefore,
      equityPct: equity * 100,
      requiredEquityPct: requiredEq !== null ? requiredEq * 100 : null,
      bestAction: ev.bestAction,
      takenEvBb: ev.takenEvBb,
      bestEvBb: ev.bestEvBb,
      deviationBb: ev.deviationBb,
      gtoMatch: match,
      boardTexture: texture,
      handCategory,
      estimatedVillainRange: villainRange ? summarizeRange(villainRange, 'villain') : undefined,
      equityVsRangePct: equityVsRange * 100,
      outsBreakdown: outs ?? undefined,
      foldEquity: isBettingAction ? foldEq : undefined,
      evBetBb: adv.evBetBb,
      evRaiseBb: adv.evRaiseBb,
      impliedOddsBonusBb: adv.impliedOddsBonusBb,
      verdict: verdictResult.verdict,
      reasoning: verdictResult.reasoning,
    });
  }

  return { handId: state.handId, yourSeat, actions };
}

// 「代表敵」を選ぶ: entry より前に active で、最も最近 voluntary action を取った相手。
function pickPrimaryVillain(
  state: HandState,
  entry: import('../game/types').ActionEntry,
  yourSeat: Seat,
): Seat | null {
  const idx = state.actions.indexOf(entry);
  const prior = idx >= 0 ? state.actions.slice(0, idx) : [];
  const folded = new Set<Seat>();
  for (const a of prior) {
    if (a.type === 'fold') folded.add(a.seat);
  }
  // active な相手で最も後にアクションした人を選ぶ
  for (let i = prior.length - 1; i >= 0; i--) {
    const a = prior[i];
    if (!a) continue;
    if (a.seat === yourSeat) continue;
    if (folded.has(a.seat)) continue;
    return a.seat;
  }
  // 履歴がない場合は他席で先頭を返す
  for (const seat of state.players.keys()) {
    if (seat !== yourSeat && !folded.has(seat)) return seat;
  }
  return null;
}

// entry より前のアクションをみて、fold していない他席（自分以外）の数を返す。
function countActiveOpponents(
  state: HandState,
  entry: import('../game/types').ActionEntry,
  yourSeat: Seat,
): number {
  const idx = state.actions.indexOf(entry);
  const prior = idx >= 0 ? state.actions.slice(0, idx) : [];
  const folded = new Set<Seat>();
  for (const a of prior) {
    if (a.type === 'fold') folded.add(a.seat);
  }
  let count = 0;
  for (const seat of state.players.keys()) {
    if (seat !== yourSeat && !folded.has(seat)) count++;
  }
  return Math.max(1, count);
}

function boardAtStreet(fullBoard: readonly Card[], street: Street): Card[] {
  switch (street) {
    case 'preflop':
      return [];
    case 'flop':
      return fullBoard.slice(0, 3);
    case 'turn':
      return fullBoard.slice(0, 4);
    case 'river':
      return fullBoard.slice(0, 5);
    case 'showdown':
      return [...fullBoard];
  }
}
