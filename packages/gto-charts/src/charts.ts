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

const chartCache = new Map<string, GtoChart>();

export function loadChart(position: Position, scenario: ChartScenario): GtoChart {
  const key = `${scenario}/${position}`;
  const cached = chartCache.get(key);
  if (cached) return cached;
  const generated = scenario === 'open' ? generateOpenChart(position) : {};
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
