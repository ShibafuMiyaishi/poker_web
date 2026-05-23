import { RANK_VALUE, all169Hands } from '@pokergo/gto-charts';
import type { Card } from '@pokergo/shared';
import type { HandRange } from './types';

const SUITS = ['s', 'h', 'd', 'c'] as const;
const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'] as const;

// 169 ハンドのキー一覧 (キャッシュ)
let cachedKeys: string[] | null = null;
export function allHandKeys(): string[] {
  if (cachedKeys) return cachedKeys;
  cachedKeys = all169Hands();
  return cachedKeys;
}

// 部分的な weights から完全な HandRange を生成。未指定キーは 0。
export function createRange(weights: Partial<HandRange>): HandRange {
  const out: HandRange = {};
  for (const k of allHandKeys()) out[k] = weights[k] ?? 0;
  return out;
}

export function uniformRange(weight = 1): HandRange {
  const out: HandRange = {};
  for (const k of allHandKeys()) out[k] = weight;
  return out;
}

export function intersectRanges(a: HandRange, b: HandRange): HandRange {
  const out: HandRange = {};
  for (const k of allHandKeys()) out[k] = Math.min(a[k] ?? 0, b[k] ?? 0);
  return out;
}

// hand キー (例 "AKs") から取りうるコンボ (カード 2 枚の組) を全列挙。
export function combosForHand(handKey: string): [Card, Card][] {
  const out: [Card, Card][] = [];
  if (handKey.length === 2) {
    // ペア。同ランク x 異スーツ
    const r = handKey[0] as string;
    for (let i = 0; i < SUITS.length; i++) {
      for (let j = i + 1; j < SUITS.length; j++) {
        out.push([`${r}${SUITS[i]}` as Card, `${r}${SUITS[j]}` as Card]);
      }
    }
    return out;
  }
  const hi = handKey[0] as string;
  const lo = handKey[1] as string;
  const suited = handKey[2] === 's';
  if (suited) {
    for (const s of SUITS) out.push([`${hi}${s}` as Card, `${lo}${s}` as Card]);
  } else {
    for (const s1 of SUITS) {
      for (const s2 of SUITS) {
        if (s1 === s2) continue;
        out.push([`${hi}${s1}` as Card, `${lo}${s2}` as Card]);
      }
    }
  }
  return out;
}

// 重み付きコンボ数。deadCards に含まれるカードを持つコンボは除外。
export function countCombos(range: HandRange, deadCards: readonly Card[]): number {
  const dead = new Set<string>(deadCards);
  let total = 0;
  for (const k of allHandKeys()) {
    const w = range[k] ?? 0;
    if (w <= 0) continue;
    for (const combo of combosForHand(k)) {
      if (!dead.has(combo[0]) && !dead.has(combo[1])) total += w;
    }
  }
  return total;
}

// 重み付きランダムサンプル。deadCards に含まれるコンボはスキップ。
export function sampleFromRange(
  range: HandRange,
  deadCards: readonly Card[],
  rng: () => number,
): [Card, Card] | null {
  const dead = new Set<string>(deadCards);
  // 累積分布を構築 (ハンドごとの利用可能コンボ数 × weight)
  const cumulative: { combo: [Card, Card]; cum: number }[] = [];
  let total = 0;
  for (const k of allHandKeys()) {
    const w = range[k] ?? 0;
    if (w <= 0) continue;
    for (const combo of combosForHand(k)) {
      if (dead.has(combo[0]) || dead.has(combo[1])) continue;
      total += w;
      cumulative.push({ combo, cum: total });
    }
  }
  if (total <= 0 || cumulative.length === 0) return null;
  const r = rng() * total;
  // 二分探索
  let lo = 0;
  let hi = cumulative.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    const c = cumulative[mid];
    if (!c) break;
    if (r < c.cum) hi = mid;
    else lo = mid + 1;
  }
  return cumulative[lo]?.combo ?? null;
}

// 人間向け要約 ("BTN open ~35%" 等)
export function summarizeRange(range: HandRange, label: string): string {
  const keys = allHandKeys();
  let weighted = 0;
  for (const k of keys) weighted += range[k] ?? 0;
  const pct = (weighted / keys.length) * 100;
  return `${label} 推定 ~${pct.toFixed(0)}%`;
}

// 名前空間衝突を避けつつ正規化テーブルを公開 (other modules で再利用)
export { RANK_VALUE, RANKS, SUITS };
