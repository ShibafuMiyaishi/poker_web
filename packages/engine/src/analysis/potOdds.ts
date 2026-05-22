// pot odds と必要勝率（required equity）を計算する。
// 仕様 §10.2 の式: requiredEquity = callAmount / (potBefore + callAmount * 2)
// これは「コール後のポットに対する自分の投入額の比率」を表す。

export function computeRequiredEquity(callAmount: number, potBefore: number): number {
  if (callAmount <= 0) return 0;
  return callAmount / (potBefore + callAmount * 2);
}

export interface PotOddsResult {
  requiredEquity: number; // 0-1
  actualEquity: number; // 0-1
  isPlusEv: boolean;
}

export function evaluatePotOdds(
  equity: number,
  callAmount: number,
  potBefore: number,
): PotOddsResult {
  const requiredEquity = computeRequiredEquity(callAmount, potBefore);
  return {
    requiredEquity,
    actualEquity: equity,
    isPlusEv: equity > requiredEquity,
  };
}
