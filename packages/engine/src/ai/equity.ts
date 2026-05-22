import type { Card } from '@pokergo/shared';
import { ALL_52_CARDS } from '@pokergo/shared';
import { type Rng, cryptoRng } from '../game/deck';
import { compareHands } from '../game/handEvaluator';

// Monte Carlo: hero のホールカード + board に対し、残りデッキから villain の 2 枚
// と残りのボードをランダム抽出して比較。tie は 0.5 勝として加算する。
export function equityVsRandom(
  hero: readonly [Card, Card],
  board: readonly Card[],
  iterations = 1000,
  rng: Rng = cryptoRng,
): number {
  const used = new Set<string>([...hero, ...board]);
  const remaining = (ALL_52_CARDS as readonly Card[]).filter((c) => !used.has(c));
  const needBoard = 5 - board.length;
  const sampleSize = 2 + needBoard;

  let wins = 0;
  for (let i = 0; i < iterations; i++) {
    const picked = sampleK(remaining, sampleSize, rng);
    const villainHand: [Card, Card] = [picked[0] as Card, picked[1] as Card];
    const boardFill = picked.slice(2);
    const fullBoard = [...board, ...boardFill];

    const heroCards = [...hero, ...fullBoard];
    const villCards = [...villainHand, ...fullBoard];
    const winners = compareHands([heroCards, villCards]);
    if (winners.length === 2) wins += 0.5;
    else if (winners[0] === 0) wins += 1;
  }
  return wins / iterations;
}

function sampleK(pool: readonly Card[], k: number, rng: Rng): Card[] {
  if (k > pool.length) throw new Error(`sampleK: k=${k} > pool=${pool.length}`);
  const arr = [...pool];
  const out: Card[] = [];
  for (let i = 0; i < k; i++) {
    const idx = Math.floor(rng() * arr.length);
    const card = arr[idx];
    if (!card) continue;
    out.push(card);
    arr[idx] = arr[arr.length - 1] as Card;
    arr.pop();
  }
  return out;
}
