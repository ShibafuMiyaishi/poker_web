import type { Card } from '@pokergo/shared';
import { Hand } from 'pokersolver';

export interface HandRank {
  rank: number;
  name: string;
  description: string;
  cards: Card[];
}

function assertCardCount(cards: readonly Card[], fnName: string): void {
  if (cards.length < 5 || cards.length > 7) {
    throw new Error(`${fnName} requires 5-7 cards, got ${cards.length}`);
  }
}

// 5 枚=フロップ時点、6 枚=ターン時点、7 枚=リバー/showdown。
// 分析エンジンが各ストリート時点の最善ハンドを計算するため 5〜7 を受ける。
export function evaluateHand(cards: readonly Card[]): HandRank {
  assertCardCount(cards, 'evaluateHand');
  const hand = Hand.solve(cards as readonly string[]);
  return {
    rank: hand.rank,
    name: hand.name,
    description: hand.descr,
    cards: hand.cards.map((c) => `${c.value}${c.suit}` as Card),
  };
}

// pokersolver の Hand.compare() を使って winner を index で返す。
// Hand.winners の戻り値参照に依存しないので将来のバージョンアップで壊れにくい。
export function compareHands(hands: readonly (readonly Card[])[]): number[] {
  if (hands.length === 0) return [];
  for (const h of hands) assertCardCount(h, 'compareHands');
  const solved = hands.map((h) => Hand.solve(h as readonly string[]));
  const [first, ...rest] = solved;
  if (!first) return [];
  let best: Hand = first;
  for (const h of rest) {
    if (h.compare(best) < 0) best = h;
  }
  const winners: number[] = [];
  for (let i = 0; i < solved.length; i++) {
    const h = solved[i];
    if (h && h.compare(best) === 0) winners.push(i);
  }
  return winners;
}
