import { ALL_52_CARDS } from '@pokergo/shared';
import type { Card } from '@pokergo/shared';
import { sampleFromRange } from '../analysis/handRange';
import type { HandRange } from '../analysis/types';
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

// Monte Carlo equity vs 推定 villain レンジ。
// villain hand は range から重み付きサンプリングし、それを 1 人として残ボードを抽選。
export function equityVsRange(
  hero: readonly [Card, Card],
  board: readonly Card[],
  villainRange: HandRange,
  iterations = 500,
  rng: Rng = cryptoRng,
  deadCards: readonly Card[] = [],
): number {
  const usedBase = new Set<string>([...hero, ...board, ...deadCards]);
  const remainingFull = (ALL_52_CARDS as readonly Card[]).filter((c) => !usedBase.has(c));
  const needBoard = 5 - board.length;
  if (needBoard < 0) throw new Error('equityVsRange: board too long');

  let wins = 0;
  let valid = 0;
  for (let i = 0; i < iterations; i++) {
    const villain = sampleFromRange(villainRange, [...hero, ...board, ...deadCards], rng);
    if (!villain) continue;
    // villain のカードを差し引いた残デッキから boardFill を引く
    const usedSet = new Set<string>([...hero, ...board, ...deadCards, villain[0], villain[1]]);
    const pool = remainingFull.filter((c) => !usedSet.has(c));
    if (pool.length < needBoard) continue;
    const boardFill = sampleK(pool, needBoard, rng);
    const fullBoard = [...board, ...boardFill];
    const winners = compareHands([
      [...hero, ...fullBoard],
      [villain[0], villain[1], ...fullBoard],
    ]);
    if (winners.includes(0)) wins += 1 / winners.length;
    valid += 1;
  }
  return valid > 0 ? wins / valid : 0;
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
