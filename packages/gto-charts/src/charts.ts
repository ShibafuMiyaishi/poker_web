import { RANK_VALUE, all169Hands } from './normalize';

// 正規化ハンド表記 → GTO アクション
export type GtoAction = 'raise' | 'call' | 'fold' | `mixed:${string}`;
export type GtoChart = Record<string, GtoAction>;

export type Position = 'UTG' | 'UTG+1' | 'MP' | 'HJ' | 'CO' | 'BTN' | 'SB' | 'BB';
export type ChartScenario = 'open' | 'vs-raise' | 'vs-3bet';

// ヒューリスティック・ハンドストレングス（vs ランダム 1 人の概算エクイティ）。
// 厳密な GTO ではなく、Phase 1 用の代替値。仕様 §17 R1 のライセンス確認が済めば
// 実データに差し替える。
export function handStrength(normalized: string): number {
  if (normalized.length === 2) {
    const ch = normalized[0];
    const r = ch ? RANK_VALUE[ch] : undefined;
    if (r === undefined) return 0;
    // ペア: AA=0.85, 22=0.50 で線形補間
    return 0.5 + (r - 2) * 0.029;
  }
  const c1 = normalized[0];
  const c2 = normalized[1];
  const v1 = c1 ? RANK_VALUE[c1] : undefined;
  const v2 = c2 ? RANK_VALUE[c2] : undefined;
  if (v1 === undefined || v2 === undefined) return 0;
  const suited = normalized[2] === 's';
  let s = 0.3 + (v1 + v2) / 100;
  if (suited) s += 0.04;
  const gap = v1 - v2 - 1;
  if (gap === 0) s += 0.03;
  else if (gap === 1) s += 0.02;
  else if (gap === 2) s += 0.01;
  if (v1 === 14 && suited) s += 0.03; // Ax suited bonus
  return Math.min(0.85, s);
}

// ポジション別の open 闾値（strength >= threshold で raise、+0.05 以上で確定 raise）
const OPEN_THRESHOLDS: Record<Position, number> = {
  UTG: 0.65,
  'UTG+1': 0.63,
  MP: 0.6,
  HJ: 0.58,
  CO: 0.55,
  BTN: 0.5,
  SB: 0.53,
  BB: 1.0, // BB は open 不可（クロージング側）
};

// vs-raise: 3-bet ライン（raise）と call ライン（call）を分ける。
// 3-bet は premium のみ、call は若干広く。後段ポジションほど広い。
const VS_RAISE_3BET_THRESHOLDS: Record<Position, number> = {
  UTG: 0.78,
  'UTG+1': 0.77,
  MP: 0.76,
  HJ: 0.74,
  CO: 0.72,
  BTN: 0.7,
  SB: 0.72,
  BB: 0.68,
};

const VS_RAISE_CALL_THRESHOLDS: Record<Position, number> = {
  UTG: 0.62,
  'UTG+1': 0.6,
  MP: 0.58,
  HJ: 0.56,
  CO: 0.54,
  BTN: 0.52,
  SB: 0.55,
  BB: 0.48, // BB はクロージング、pot odds 有利でディフェンドワイド
};

// vs-3bet: 4-bet ライン (premium only) と call ライン
const VS_3BET_4BET_THRESHOLDS: Record<Position, number> = {
  UTG: 0.82,
  'UTG+1': 0.81,
  MP: 0.8,
  HJ: 0.79,
  CO: 0.78,
  BTN: 0.77,
  SB: 0.78,
  BB: 0.78,
};

const VS_3BET_CALL_THRESHOLDS: Record<Position, number> = {
  UTG: 0.72,
  'UTG+1': 0.7,
  MP: 0.68,
  HJ: 0.66,
  CO: 0.64,
  BTN: 0.62,
  SB: 0.65,
  BB: 0.62,
};

function generateOpenChart(position: Position): GtoChart {
  const threshold = OPEN_THRESHOLDS[position];
  const chart: GtoChart = {};
  for (const hand of all169Hands()) {
    const s = handStrength(hand);
    if (s >= threshold + 0.05) chart[hand] = 'raise';
    else if (s >= threshold) chart[hand] = 'mixed:0.50';
    else chart[hand] = 'fold';
  }
  return chart;
}

function generateVsChart(
  position: Position,
  raiseThresholds: Record<Position, number>,
  callThresholds: Record<Position, number>,
): GtoChart {
  const raiseThreshold = raiseThresholds[position];
  const callThreshold = callThresholds[position];
  const chart: GtoChart = {};
  for (const hand of all169Hands()) {
    const s = handStrength(hand);
    if (s >= raiseThreshold) chart[hand] = 'raise';
    else if (s >= callThreshold) chart[hand] = 'call';
    else chart[hand] = 'fold';
  }
  return chart;
}

const chartCache = new Map<string, GtoChart>();

export function loadChart(position: Position, scenario: ChartScenario): GtoChart {
  const key = `${scenario}/${position}`;
  const cached = chartCache.get(key);
  if (cached) return cached;
  let generated: GtoChart;
  if (scenario === 'open') {
    generated = generateOpenChart(position);
  } else if (scenario === 'vs-raise') {
    generated = generateVsChart(position, VS_RAISE_3BET_THRESHOLDS, VS_RAISE_CALL_THRESHOLDS);
  } else {
    // vs-3bet
    generated = generateVsChart(position, VS_3BET_4BET_THRESHOLDS, VS_3BET_CALL_THRESHOLDS);
  }
  chartCache.set(key, generated);
  return generated;
}

// 'raise' / 'call' / 'fold' / 'mixed:0.30' を実アクションに解決する。
export function resolveMixedAction(
  action: GtoAction,
  rng: () => number,
): 'raise' | 'call' | 'fold' {
  if (action === 'raise' || action === 'call' || action === 'fold') return action;
  // mixed:0.30 → 30% で raise、70% で fold（vs-raise なら call も）
  const m = action.match(/^mixed:([0-9.]+)$/);
  const p = m?.[1] ? Number.parseFloat(m[1]) : 0;
  return rng() < p ? 'raise' : 'fold';
}
