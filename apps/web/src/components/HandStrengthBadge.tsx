import { evaluateHand } from '@pokergo/engine';
import type { Card } from '@pokergo/shared';
import { useMemo } from 'react';

interface Props {
  holeCards: readonly [Card, Card] | null;
  board: readonly Card[];
}

// 役の宣告カード。signature element.
// 英 serif + 日本語 mincho の対比、brass の縁取り、glow。
const NAME_JP: Record<string, string> = {
  'Royal Flush': 'ロイヤルストレートフラッシュ',
  'Straight Flush': 'ストレートフラッシュ',
  'Four of a Kind': 'フォーカード',
  'Full House': 'フルハウス',
  Flush: 'フラッシュ',
  Straight: 'ストレート',
  'Three of a Kind': 'スリーカード',
  'Two Pair': 'ツーペア',
  Pair: 'ワンペア',
  'High Card': 'ハイカード',
};
const NAME_KANJI: Record<string, string> = {
  'Royal Flush': '極上',
  'Straight Flush': '直連',
  'Four of a Kind': '四枚',
  'Full House': '満卓',
  Flush: '同色',
  Straight: '直列',
  'Three of a Kind': '三枚',
  'Two Pair': '双対',
  Pair: '一対',
  'High Card': '単牌',
};

const RANK_JP: Record<string, string> = {
  A: 'A',
  K: 'K',
  Q: 'Q',
  J: 'J',
  T: '10',
  '10': '10',
  '9': '9',
  '8': '8',
  '7': '7',
  '6': '6',
  '5': '5',
  '4': '4',
  '3': '3',
  '2': '2',
};

export function HandStrengthBadge({ holeCards, board }: Props) {
  const info = useMemo(() => {
    if (!holeCards) return null;
    const all = [holeCards[0], holeCards[1], ...board];
    if (all.length < 5) {
      return previewHand(holeCards[0], holeCards[1]);
    }
    try {
      const r = evaluateHand(all);
      return {
        en: r.name,
        jp: NAME_JP[r.name] ?? r.name,
        kanji: NAME_KANJI[r.name] ?? '',
        detail: r.description,
      };
    } catch {
      return null;
    }
  }, [holeCards, board]);

  if (!info || !holeCards) return null;

  return (
    <div className="relative inline-block animate-verdict">
      <div className="relative px-5 py-2 rounded-md border border-brass/50 bg-gradient-to-b from-ink-deep/95 via-ink/95 to-ink-deepest/95 shadow-verdict">
        {/* 上下 brass ライン */}
        <div className="absolute top-0 left-2 right-2 h-px bg-gradient-to-r from-transparent via-brass to-transparent" />
        <div className="absolute bottom-0 left-2 right-2 h-px bg-gradient-to-r from-transparent via-brass to-transparent" />

        <div className="flex items-baseline gap-3 justify-center">
          {/* 漢字 (mincho, 大) */}
          {info.kanji && (
            <span className="font-jp text-xl sm:text-2xl text-brass-light tracking-widest leading-none">
              {info.kanji}
            </span>
          )}
          {/* divider */}
          <span className="text-brass/40 leading-none">|</span>
          {/* 日本語名 */}
          <span className="font-jp text-sm sm:text-base text-ivory tracking-wider">{info.jp}</span>
        </div>

        <div className="flex items-baseline gap-2 justify-center mt-1">
          <span className="font-display italic text-[10px] sm:text-xs text-brass tracking-widest uppercase">
            {info.en}
          </span>
          {info.detail && (
            <span className="text-[10px] text-ivory-muted truncate max-w-[200px] font-mono-tabular">
              · {info.detail}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function previewHand(a: Card, b: Card): { en: string; jp: string; kanji: string; detail: string } {
  const r1 = a[0];
  const r2 = b[0];
  if (!r1 || !r2) return { en: 'Pre-Flop', jp: 'プリフロップ', kanji: '初手', detail: '' };
  if (r1 === r2) {
    const rk = RANK_JP[r1] ?? r1;
    return { en: `Pocket ${rk}s`, jp: `ポケット${rk}`, kanji: '対子', detail: 'Pre-flop pair' };
  }
  const suited = a[1] === b[1];
  const high = RANK_JP[r1] ?? r1;
  const low = RANK_JP[r2] ?? r2;
  return {
    en: `${high}${low} ${suited ? 'suited' : 'offsuit'}`,
    jp: `${high}${low}${suited ? 'スーテッド' : 'オフスーツ'}`,
    kanji: suited ? '同色' : '離色',
    detail: 'Pre-flop',
  };
}
