import { evaluateHand } from '@pokergo/engine';
import type { Card } from '@pokergo/shared';
import { useMemo } from 'react';

interface Props {
  holeCards: readonly [Card, Card] | null;
  board: readonly Card[];
}

// HandStrengthBadge v4:
//   役完成時、朱印「役」(yaku = ハンドの「役」) を固定スタンプとして使用。
//   慣習語ではない造語漢字 (双/参/極) を撤回し、確実な「役」1 文字に統一。
//   役名は **カタカナのみ** (日本のポーカーで標準)、英語 sub + 詳細 (A's & 8's 等)。
//
//   フロップ以降のみ表示。

const NAME_JP: Record<string, string> = {
  'Royal Flush': 'ロイヤルフラッシュ',
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

const STRENGTH_LEVEL: Record<string, number> = {
  'High Card': 0,
  Pair: 1,
  'Two Pair': 2,
  'Three of a Kind': 3,
  Straight: 4,
  Flush: 5,
  'Full House': 6,
  'Four of a Kind': 7,
  'Straight Flush': 8,
  'Royal Flush': 9,
};

export function HandStrengthBadge({ holeCards, board }: Props) {
  const info = useMemo(() => {
    if (!holeCards) return null;
    if (board.length < 3) return null;

    const all = [holeCards[0], holeCards[1], ...board];
    try {
      const r = evaluateHand(all);
      return {
        en: r.name,
        jp: NAME_JP[r.name] ?? r.name,
        detail: r.description,
        level: STRENGTH_LEVEL[r.name] ?? 0,
      };
    } catch {
      return null;
    }
  }, [holeCards, board]);

  if (!info) return null;

  const strong = info.level >= 6;
  const high = info.level >= 3;
  const accentText = strong ? 'text-jade-glow' : 'text-brass-light';
  const borderTone = strong
    ? 'border-jade/55 shadow-[0_0_28px_rgba(110,231,183,0.25)]'
    : high
      ? 'border-brass/55 shadow-[0_8px_24px_-6px_rgba(245,215,122,0.4)]'
      : 'border-brass/30';

  const stampKey = `${info.en}-${board.length}`;

  return (
    <output
      key={stampKey}
      className={`relative inline-flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-md border-2 bg-gradient-to-b from-ink-deep/95 to-ink-abyss/95 paper-noise animate-stamp ${borderTone}`}
      aria-live="polite"
    >
      <div className="absolute top-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-brass/70 to-transparent" />
      <div className="absolute bottom-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-brass/70 to-transparent" />

      {/* 朱印「役」(固定: yaku = ハンドの役) */}
      <div
        className="ink-seal w-11 h-11 sm:w-14 sm:h-14 flex items-center justify-center shrink-0 text-2xl sm:text-3xl"
        aria-hidden="true"
      >
        役
      </div>

      {/* 役名 */}
      <div className="flex flex-col items-start leading-tight">
        <span className={`font-jp font-bold text-base sm:text-xl ${accentText} tracking-wider`}>
          {info.jp}
        </span>
        <span className="font-display italic text-[10px] sm:text-xs text-ivory-dim tracking-widest uppercase mt-0.5">
          {info.en}
        </span>
        {info.detail && (
          <span className="hidden sm:inline text-[10px] text-ivory-muted font-mono-tabular truncate max-w-[200px] mt-0.5">
            {info.detail}
          </span>
        )}
      </div>
    </output>
  );
}
