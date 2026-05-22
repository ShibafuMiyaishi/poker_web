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
  takenEvBb: number | null; // bet/raise/all_in は villain レンジ推定が必要なため評価不能
  deviationBb: number | null;
}

// 採用アクションと最善アクションを比較して deviation を返す。
// fold / check / call 採用は評価可能、bet/raise/all_in 採用は null（Phase 1 では未対応）。
// toCallBefore === 0 のときは fold が論理的に無意味なので bestAction は常に check（passive 側）。
export function compareEv(
  taken: ActionType,
  equity: number,
  toCallBefore: number,
  potBefore: number,
  bb: number,
): BestActionDecision {
  const foldEv = evFold();
  const passiveEv =
    toCallBefore > 0 ? evCall(equity, toCallBefore, potBefore) : evCheck(equity, potBefore);
  const passiveAction: ActionType = toCallBefore > 0 ? 'call' : 'check';

  // bestAction の決定
  let bestEv: number;
  let bestAction: ActionType;
  if (toCallBefore === 0) {
    // チェック局面で fold は採らない
    bestEv = passiveEv;
    bestAction = passiveAction;
  } else if (passiveEv >= foldEv) {
    bestEv = passiveEv;
    bestAction = passiveAction;
  } else {
    bestEv = foldEv;
    bestAction = 'fold';
  }

  // taken の EV: fold/check/call は具体値、それ以外は null
  let takenEv: number | null;
  if (taken === 'fold') takenEv = foldEv;
  else if (taken === 'check') takenEv = toCallBefore === 0 ? passiveEv : null;
  else if (taken === 'call') takenEv = toCallBefore > 0 ? passiveEv : null;
  else takenEv = null; // bet / raise / all_in

  return {
    bestAction,
    bestEvBb: bestEv / bb,
    takenEvBb: takenEv !== null ? takenEv / bb : null,
    deviationBb: takenEv !== null ? (bestEv - takenEv) / bb : null,
  };
}
