// アクション別 EV を計算する。bb 単位で返す。
//
// EV(fold) = 0
// EV(call) = equity * (potBefore + callAmount) - (1 - equity) * callAmount
//          = equity * potBefore + callAmount * (2*equity - 1)
//
// Phase 1 では raise の EV は villain の fold/call レンジ推定が必要なため
// 計算しない（仕様 §10.3 では「MVP では簡略化」と明記）。

export function evFold(): number {
  return 0;
}

export function evCall(equity: number, callAmount: number, potBefore: number): number {
  return equity * (potBefore + callAmount) - (1 - equity) * callAmount;
}

// EV(check) は「現ポットを equity で取れる期待値」の概算。
// 実際は今後のストリート展開で変動するため近似値。
export function evCheck(equity: number, potBefore: number): number {
  return equity * potBefore;
}

import type { ActionType } from '@pokergo/shared';

export interface BestActionDecision {
  bestAction: ActionType;
  bestEvBb: number;
  takenEvBb: number;
  deviationBb: number; // EV(best) - EV(taken)
}

// 採用アクションと最善アクションを比較して deviation を返す。
// raise は対象外（fold/check/call のみ評価）。
export function compareEv(
  taken: ActionType,
  equity: number,
  toCallBefore: number,
  potBefore: number,
  bb: number,
): BestActionDecision {
  const foldEv = evFold();
  const callEv =
    toCallBefore > 0 ? evCall(equity, toCallBefore, potBefore) : evCheck(equity, potBefore);
  const otherOption: ActionType = toCallBefore > 0 ? 'call' : 'check';

  const bestEv = Math.max(foldEv, callEv);
  const bestAction: ActionType = bestEv === foldEv ? 'fold' : otherOption;

  // taken の EV を判定: fold ならば 0、それ以外（call/check/bet/raise/all_in）は callEv で近似
  const takenEv = taken === 'fold' ? foldEv : callEv;

  return {
    bestAction,
    bestEvBb: bestEv / bb,
    takenEvBb: takenEv / bb,
    deviationBb: (bestEv - takenEv) / bb,
  };
}
