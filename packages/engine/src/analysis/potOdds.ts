// pot odds と必要勝率（required equity）を計算する。
// 正しい式: requiredEquity = callAmount / (potBefore + callAmount)
//   - "potBefore + callAmount" = call 後の総ポット。
//   - call/(pot+call) は EV(call) = eq*pot - (1-eq)*call が 0 になる equity。
// 注: 仕様書 §10.3 の旧式 callAmount/(potBefore + callAmount*2) は誤りで、
// 必要勝率を過小評価していた (pot=100/call=50 で 25% と算出するが、実際は 33%)。

export function computeRequiredEquity(callAmount: number, potBefore: number): number {
  if (callAmount <= 0) return 0;
  return callAmount / (potBefore + callAmount);
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
