import { RANK_VALUE } from '@pokergo/gto-charts';
import type { Card } from '@pokergo/shared';

export type BoardTextureTag =
  | 'monotone'
  | 'two_tone'
  | 'rainbow'
  | 'paired'
  | 'connected'
  | 'high_card'
  | 'low'
  | 'dynamic'
  | 'dry';

// 仕様 §10.5。フロップ以降の board に対して tag を複数返す。
// preflop（board.length === 0）は空配列。
export function classifyBoard(board: readonly Card[]): BoardTextureTag[] {
  if (board.length < 3) return [];
  const tags: BoardTextureTag[] = [];

  const suits = board.map((c) => c[1] ?? '');
  const suitCount = new Map<string, number>();
  for (const s of suits) suitCount.set(s, (suitCount.get(s) ?? 0) + 1);
  const maxSuit = Math.max(...suitCount.values());
  if (maxSuit >= 3) tags.push('monotone');
  else if (maxSuit === 2) tags.push('two_tone');
  else tags.push('rainbow');

  const ranks = board
    .map((c) => RANK_VALUE[c[0] ?? ''] ?? 0)
    .filter((r) => r > 0)
    .sort((a, b) => a - b);

  const rankCount = new Map<number, number>();
  for (const r of ranks) rankCount.set(r, (rankCount.get(r) ?? 0) + 1);
  if (Math.max(...rankCount.values()) >= 2) tags.push('paired');

  // ハイ/ロー
  const highest = ranks[ranks.length - 1] ?? 0;
  if (highest >= 12) tags.push('high_card');
  else if (highest <= 9) tags.push('low');

  // connected: 一意ランクの最大差が 4 以内
  const unique = [...new Set(ranks)];
  const lowest = unique[0] ?? 0;
  const top = unique[unique.length - 1] ?? 0;
  if (unique.length >= 3 && top - lowest <= 4) tags.push('connected');

  // dynamic / dry: two_tone もフラッシュドロー含むので dynamic に含める
  if (tags.includes('monotone') || tags.includes('two_tone') || tags.includes('connected')) {
    tags.push('dynamic');
  } else if (tags.includes('rainbow') && !tags.includes('paired')) {
    tags.push('dry');
  }

  return tags;
}
