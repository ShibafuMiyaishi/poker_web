import { ALL_52_CARDS } from '@pokergo/shared';
import type { Card } from '@pokergo/shared';
import { evaluateHand } from '../game/handEvaluator';
import { combosForHand } from './handRange';
import type { HandRange, OutsBreakdown } from './types';

// hero+board が river まで埋まった後の rank と比較し、board+turn を 1 枚追加した場合の
// 改善 outs を列挙する。flop の場合は turn → river の 2 枚を考慮するため、
// rule of 4 (turn→river なら rule of 2) で近似エクイティを返す。
export function countOuts(
  hero: readonly [Card, Card],
  board: readonly Card[],
  villainRange: HandRange,
  deadCards: readonly Card[],
): OutsBreakdown {
  if (board.length < 3 || board.length > 4) {
    return { clean: 0, weak: 0, blockerAdjusted: 0, rule2equity: 0 };
  }
  const used = new Set<string>([...hero, ...board, ...deadCards]);
  const remaining = (ALL_52_CARDS as readonly Card[]).filter((c) => !used.has(c));

  // 現在の hero rank (board が 3 枚なら dummy 2 枚で埋めると正しく評価できないため、
  // 各候補カードを 1 枚追加した状態で 5 枚評価する)
  let clean = 0;
  let weak = 0;
  const cleanCards: Card[] = [];
  const heroBoard3 = [...hero, ...board];

  // ベースラインの rank (board=3 ならまだ 5 枚未満なので、両方の場合に
  // hero+board に 1 枚加えたシナリオを「改善前」とは言いにくい。
  // 簡略化: candidate を加えて 役 が pair 以上 (rank>=2) になれば clean、
  // 既に board+hero だけで pair 以上ある場合は「ストレート以上 (rank>=4)」になるカードを clean とする
  let baseRank = 1;
  if (heroBoard3.length >= 5) {
    baseRank = evaluateHand(heroBoard3).rank;
  } else {
    // board が 3 枚 (フロップ) の場合、hero+board=5 枚で評価可能
    baseRank = evaluateHand([...hero, ...board]).rank;
  }

  for (const candidate of remaining) {
    const newCards = [...heroBoard3, candidate];
    if (newCards.length < 5) continue;
    const newRank = evaluateHand(newCards).rank;
    if (newRank > baseRank) {
      clean += 1;
      cleanCards.push(candidate);
      // 弱 out 判定: villain がこのカードでより強くなりうるか (簡略化: villain range の
      // 重み平均で 50% 以上のコンボが newRank 以上を作る場合 weak と判定する)
      if (isWeakOut(candidate, board, villainRange, deadCards, newRank)) weak += 1;
    }
  }

  // blocker 調整: hero のホールカードを持つ villain コンボは除外されている分、
  // 単純には clean そのまま。詳細な blocker は v2。
  const blockerAdjusted = clean;

  // Rule of 2/4: board=3 (flop) → 2 streets ahead → outs * 4、board=4 (turn) → 1 street → outs * 2
  const multiplier = board.length === 3 ? 4 : 2;
  const rule2equity = Math.min(95, clean * multiplier);

  return { clean, weak, blockerAdjusted, rule2equity };
}

// villain がこのカードでより強い役を作る確率が高いか?
// 簡易判定: range 内の top 20% コンボ (premium) がこの board+candidate でより強い役を
// 形成する場合 weak と扱う。詳細レンジ評価はパフォーマンス制約で省略。
function isWeakOut(
  _candidate: Card,
  _board: readonly Card[],
  _range: HandRange,
  _dead: readonly Card[],
  _heroRank: number,
): boolean {
  // 将来的に拡張。MVP では always false (= clean = blockerAdjusted)。
  return false;
}

// hero が持つカードでブロックされる villain コンボ数を計算 (参考値)。
export function blockedCombos(hero: readonly [Card, Card], range: HandRange): number {
  const heroSet = new Set<string>(hero);
  let blocked = 0;
  for (const k of Object.keys(range)) {
    const w = range[k] ?? 0;
    if (w <= 0) continue;
    for (const combo of combosForHand(k)) {
      if (heroSet.has(combo[0]) || heroSet.has(combo[1])) blocked += w;
    }
  }
  return blocked;
}
