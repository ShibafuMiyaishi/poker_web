import { ALL_52_CARDS } from '@pokergo/shared';
import type { Card } from '@pokergo/shared';
import { type Rng, cryptoRng } from '../game/deck';
import { compareHands } from '../game/handEvaluator';

// Monte Carlo equity vs ランダムな N 人。
// hero + board + N*2 villain + 残りボードを 1 ストロークでサンプリングして比較。
// tie は 1/勝者数 ずつ加算（hero が tie に含まれた場合）。
export function equityVsRandom(
  hero: readonly [Card, Card],
  board: readonly Card[],
  iterations = 1000,
  rng: Rng = cryptoRng,
  numOpponents = 1,
): number {
  if (numOpponents < 1) throw new Error('equityVsRandom: numOpponents must be >= 1');
  const used = new Set<string>([...hero, ...board]);
  const remaining = (ALL_52_CARDS as readonly Card[]).filter((c) => !used.has(c));
  const needBoard = 5 - board.length;
  const sampleSize = 2 * numOpponents + needBoard;
  if (sampleSize > remaining.length) {
    throw new Error(`equityVsRandom: not enough cards for ${numOpponents} opponents`);
  }

  let wins = 0;
  for (let i = 0; i < iterations; i++) {
    const picked = sampleK(remaining, sampleSize, rng);
    const villainHands: [Card, Card][] = [];
    for (let v = 0; v < numOpponents; v++) {
      const c1 = picked[v * 2];
      const c2 = picked[v * 2 + 1];
      if (!c1 || !c2) continue;
      villainHands.push([c1, c2]);
    }
    const boardFill = picked.slice(2 * numOpponents);
    const fullBoard = [...board, ...boardFill];

    const allHands: Card[][] = [[...hero, ...fullBoard]];
    for (const v of villainHands) allHands.push([...v, ...fullBoard]);

    const winnerIdx = compareHands(allHands);
    if (winnerIdx.includes(0)) {
      // hero が勝者集合に含まれる。タイの場合は 1/N をシェア
      wins += 1 / winnerIdx.length;
    }
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
