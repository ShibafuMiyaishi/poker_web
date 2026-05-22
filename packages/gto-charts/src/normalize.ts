import type { Card } from '@pokergo/shared';

export const RANK_VALUE: Record<string, number> = {
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  T: 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

// 2 枚のホールカードを GTO チャート参照キーに正規化する。
// AA, AKs, T9o, 55 など 169 種類のいずれかを返す。
export function normalizeHand(cards: readonly [Card, Card]): string {
  const r1 = cards[0]?.[0];
  const r2 = cards[1]?.[0];
  const s1 = cards[0]?.[1];
  const s2 = cards[1]?.[1];
  if (!r1 || !r2 || !s1 || !s2) {
    throw new Error(`normalizeHand: invalid cards ${cards.join(' ')}`);
  }
  if (r1 === r2) return `${r1}${r2}`;
  const v1 = RANK_VALUE[r1];
  const v2 = RANK_VALUE[r2];
  if (v1 === undefined || v2 === undefined) {
    throw new Error(`normalizeHand: unknown rank in ${cards.join(' ')}`);
  }
  const hi = v1 > v2 ? r1 : r2;
  const lo = hi === r1 ? r2 : r1;
  return `${hi}${lo}${s1 === s2 ? 's' : 'o'}`;
}

// 169 種類全てのハンド表記を返す。
export function all169Hands(): string[] {
  const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
  const out: string[] = [];
  for (let i = 0; i < ranks.length; i++) {
    const ri = ranks[i];
    if (!ri) continue;
    out.push(`${ri}${ri}`);
    for (let j = i + 1; j < ranks.length; j++) {
      const rj = ranks[j];
      if (!rj) continue;
      out.push(`${ri}${rj}s`);
      out.push(`${ri}${rj}o`);
    }
  }
  return out;
}
