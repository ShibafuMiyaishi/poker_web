import { RANK_VALUE } from '@pokergo/gto-charts';
import type { Card } from '@pokergo/shared';
import { evaluateHand } from '../game/handEvaluator';
import type { HandCategory } from './types';

// hero の hole + board を受けてハンドカテゴリを返す。
// board 5枚: 役 (pair〜straight-flush)
// board 3-4枚: ペア/ドロー判定。pokersolver の都合上 evaluateHand は 5 枚以上なので
//   ターン (board 4) は dummy 1 枚追加して評価し、役は確定形のみカウント。
//   フロップ (board 3) は手で判定。
export function classifyHandCategory(
  hero: readonly [Card, Card],
  board: readonly Card[],
): HandCategory {
  if (board.length === 0) {
    // プリフロップは「役」概念は無いので簡易: ペアなら 'pair'、それ以外 'air'
    if (hero[0][0] === hero[1][0]) return 'pair';
    return 'air';
  }

  const allCards = [...hero, ...board];
  const rankOf = (c: Card): number => RANK_VALUE[c[0] ?? ''] ?? 0;
  const heroRanks = hero.map(rankOf);
  const boardRanks = board.map(rankOf);
  const boardHighest = Math.max(...boardRanks);

  // 既成役判定 (5+ 枚必要)
  let madeCategory: HandCategory | null = null;
  if (allCards.length >= 5) {
    const rank = evaluateHand(allCards).rank;
    // pokersolver の rank: 1=HighCard, 2=Pair, 3=TwoPair, 4=ThreeOfAKind, 5=Straight,
    // 6=Flush, 7=FullHouse, 8=Quads, 9=StraightFlush, 10=RoyalFlush
    if (rank >= 7) madeCategory = 'full-house-plus';
    else if (rank === 6) madeCategory = 'flush';
    else if (rank === 5) madeCategory = 'straight';
    else if (rank === 4) {
      // セット: hero がポケットペアで board の 1 枚と合致 → 隠れた強さ
      // トリップス: board にペア (例 KK2) + hero の 1 枚 (K) → 相手から見える
      const heroIsPair = hero[0][0] === hero[1][0];
      const boardPaired = new Set(boardRanks).size < boardRanks.length;
      if (heroIsPair && !boardPaired) madeCategory = 'set';
      else if (boardPaired) madeCategory = 'trips';
      else madeCategory = 'set';
    } else if (rank === 3) madeCategory = 'two-pair';
    else if (rank === 2) {
      // ペアの分類: hero のホールカードのランク vs ボード最高
      const heroIsPair = hero[0][0] === hero[1][0];
      const heroPairRank = heroIsPair ? heroRanks[0] : null;
      if (heroIsPair && heroPairRank != null) {
        if (heroPairRank > boardHighest) madeCategory = 'overpair';
        else if (heroPairRank >= 8) madeCategory = 'pair';
        else madeCategory = 'weak-pair';
      } else {
        // hero のいずれかが board とペア
        const matched = heroRanks.find((r) => boardRanks.includes(r));
        if (matched === boardHighest) madeCategory = 'top-pair';
        else if (matched != null && matched >= 10) madeCategory = 'pair';
        else madeCategory = 'weak-pair';
      }
    } else {
      // ハイカードのみ。ドロー判定へ
      madeCategory = 'air';
    }
  }

  // ドロー判定 (board 3-4 枚のみ意味がある)
  const drawCategory = board.length <= 4 ? classifyDraw(hero, board, heroRanks, boardRanks) : null;

  // ペア未満なら ドローを優先、ペア以上なら 既成役を優先 (combo-draw は別扱い)
  if (madeCategory && (madeCategory === 'air' || madeCategory === 'weak-pair')) {
    if (drawCategory) return drawCategory;
  }
  if (
    madeCategory &&
    drawCategory === 'fd' &&
    (madeCategory === 'pair' || madeCategory === 'top-pair')
  ) {
    // 強いドローと弱い役は combo-draw として扱う
    return 'combo-draw';
  }
  return madeCategory ?? drawCategory ?? 'air';
}

function classifyDraw(
  hero: readonly [Card, Card],
  board: readonly Card[],
  heroRanks: number[],
  boardRanks: number[],
): HandCategory | null {
  // フラッシュドロー: 同スーツ 4 枚
  const suitCount = new Map<string, number>();
  for (const c of [...hero, ...board]) {
    const s = c[1] ?? '';
    suitCount.set(s, (suitCount.get(s) ?? 0) + 1);
  }
  const hasFd = [...suitCount.values()].some((v) => v === 4);

  // ストレートドロー: 5 枚連続で 1 枚欠ける
  const uniqRanks = [...new Set([...heroRanks, ...boardRanks])].sort((a, b) => a - b);
  // A=14 と A=1 (wheel) を両方扱う
  const ranksWithLowAce = uniqRanks.includes(14) ? [...uniqRanks, 1] : [...uniqRanks];
  ranksWithLowAce.sort((a, b) => a - b);

  let hasOesd = false;
  let hasGs = false;
  // 連続 4 枚 (両端開き)
  for (let i = 0; i <= ranksWithLowAce.length - 4; i++) {
    const a = ranksWithLowAce[i] ?? 0;
    const b = ranksWithLowAce[i + 3] ?? 0;
    if (b - a === 3) hasOesd = true;
  }
  // 5 枚の窓に 4 枚 (片端)
  for (let lo = 2; lo <= 10; lo++) {
    const window = [lo, lo + 1, lo + 2, lo + 3, lo + 4];
    const matches = window.filter((r) => ranksWithLowAce.includes(r)).length;
    if (matches === 4 && !hasOesd) hasGs = true;
  }

  if (hasFd && (hasOesd || hasGs)) return 'combo-draw';
  if (hasFd) return 'fd';
  if (hasOesd) return 'oesd';
  if (hasGs) return 'gs';
  return null;
}
