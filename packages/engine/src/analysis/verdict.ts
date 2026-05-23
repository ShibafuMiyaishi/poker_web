import type { ActionType, Street } from '@pokergo/shared';
import type { HandCategory, OutsBreakdown, Verdict } from './types';

export interface VerdictParams {
  taken: ActionType;
  bestAction: ActionType;
  deviationBb: number | null;
  takenEvBb: number | null;
  bestEvBb: number;
  gtoMatch: boolean | null;
  handCategory: HandCategory;
  equityPct: number;
  equityVsRangePct: number;
  requiredEquityPct: number | null;
  foldEquity: number | null;
  street: Street;
  potBefore: number;
  toCallBefore: number;
  bb: number;
  heroStack: number;
  outs: OutsBreakdown | null;
  evBetBb: number | null;
  evRaiseBb: number | null;
  impliedOddsBonusBb: number;
}

export interface VerdictResult {
  verdict: Verdict;
  reasoning: string[]; // 最大 3
}

const HAND_CATEGORY_JP: Record<HandCategory, string> = {
  air: 'エア',
  'weak-pair': '弱ペア',
  pair: 'ペア',
  'top-pair': 'トップペア',
  overpair: 'オーバーペア',
  'two-pair': 'ツーペア',
  set: 'セット',
  trips: 'トリップス',
  straight: 'ストレート',
  flush: 'フラッシュ',
  'full-house-plus': 'フルハウス以上',
  gs: 'ガットショット',
  oesd: 'OESD',
  fd: 'フラッシュドロー',
  'combo-draw': 'コンボドロー',
};

// SPR (stack/pot) によるコミット判定の閾値ヒント
function sprHint(spr: number, category: HandCategory): string | null {
  if (spr < 3) {
    if (
      category === 'top-pair' ||
      category === 'overpair' ||
      category === 'set' ||
      category === 'trips' ||
      category === 'two-pair' ||
      category === 'straight' ||
      category === 'flush' ||
      category === 'full-house-plus'
    ) {
      return `低 SPR (${spr.toFixed(1)}) — トップペア以上はコミットが推奨`;
    }
  }
  if (spr > 8) {
    if (category === 'pair' || category === 'top-pair' || category === 'overpair') {
      return `高 SPR (${spr.toFixed(1)}) — ナッツ系以外は慎重に`;
    }
  }
  return null;
}

export function generateVerdict(p: VerdictParams): VerdictResult {
  const reasoning: string[] = [];
  const spr = p.potBefore > 0 ? p.heroStack / p.potBefore : Number.POSITIVE_INFINITY;

  // 主要な reasoning を最大 3 件選出 (重要度順)
  // 1) ポットオッズ / 必要勝率
  if (p.requiredEquityPct !== null) {
    if (p.equityPct > p.requiredEquityPct) {
      reasoning.push(
        `ポットオッズ ${p.requiredEquityPct.toFixed(0)}% に対しエクイティ ${p.equityPct.toFixed(0)}% — コールは +EV`,
      );
    } else {
      reasoning.push(
        `エクイティ ${p.equityPct.toFixed(0)}% が必要勝率 ${p.requiredEquityPct.toFixed(0)}% を下回り、コールは -EV`,
      );
    }
  }

  // 2) GTO 一致 (preflop のみ)
  if (p.gtoMatch === true) {
    reasoning.push('プリフロップ GTO レンジ内のアクション');
  } else if (p.gtoMatch === false) {
    reasoning.push('プリフロップ GTO チャート外のアクション');
  }

  // 3) フォールドエクイティ
  if (p.foldEquity !== null && (p.taken === 'bet' || p.taken === 'raise' || p.taken === 'all_in')) {
    if (p.foldEquity > 0.4) {
      reasoning.push(
        `フォールドエクイティ推定 ${(p.foldEquity * 100).toFixed(0)}% — ブラフ EV が高い`,
      );
    } else if (p.foldEquity < 0.2) {
      reasoning.push(
        `フォールドエクイティ ${(p.foldEquity * 100).toFixed(0)}% — ブラフ成立しづらい`,
      );
    }
  }

  // 4) ドロー / インプライドオッズ
  if (
    (p.handCategory === 'fd' || p.handCategory === 'oesd' || p.handCategory === 'combo-draw') &&
    p.outs
  ) {
    reasoning.push(
      `${HAND_CATEGORY_JP[p.handCategory]} (${p.outs.clean} outs) のインプライドオッズを考慮`,
    );
  }

  // 5) SPR ヒント
  const sprMsg = sprHint(spr, p.handCategory);
  if (sprMsg) reasoning.push(sprMsg);

  // 6) ハンドストレングス (役名のみ)
  if (
    p.handCategory === 'set' ||
    p.handCategory === 'trips' ||
    p.handCategory === 'two-pair' ||
    p.handCategory === 'straight' ||
    p.handCategory === 'flush' ||
    p.handCategory === 'full-house-plus'
  ) {
    reasoning.push(`${HAND_CATEGORY_JP[p.handCategory]} — バリュー獲得を優先`);
  }

  // 上位 3 件
  const top = reasoning.slice(0, 3);

  // verdict 判定
  let verdict: Verdict;
  const dev = p.deviationBb;
  // raise/bet/all_in は deviationBb=null → EV 比較で判定
  if (dev === null) {
    // 採用アクションの EV を best と比較
    const takenEv =
      p.taken === 'bet'
        ? p.evBetBb
        : p.taken === 'raise' || p.taken === 'all_in'
          ? p.evRaiseBb
          : null;
    if (takenEv !== null) {
      const ddev = p.bestEvBb - takenEv;
      if (ddev < 0.1) verdict = 'optimal';
      else if (ddev < 0.5) verdict = 'good';
      else if (ddev < 1.5) verdict = 'questionable';
      else verdict = 'mistake';
    } else {
      // それでも null なら gtoMatch 優先 → good or questionable
      if (p.gtoMatch === true) verdict = 'good';
      else if (p.gtoMatch === false) verdict = 'questionable';
      else verdict = 'good';
    }
  } else {
    if (dev < 0.1) verdict = p.gtoMatch !== false ? 'optimal' : 'good';
    else if (dev < 0.5) verdict = p.gtoMatch === true ? 'good' : 'questionable';
    else if (dev < 1.5) verdict = 'questionable';
    else verdict = 'mistake';
  }

  // -EV コールは強制的に mistake
  if (
    p.taken === 'call' &&
    p.requiredEquityPct !== null &&
    p.equityPct + 5 < p.requiredEquityPct &&
    (dev ?? 0) > 0.5
  ) {
    verdict = 'mistake';
  }

  return { verdict, reasoning: top };
}
