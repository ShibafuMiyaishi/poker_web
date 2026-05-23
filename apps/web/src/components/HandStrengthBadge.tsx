import { evaluateHand } from '@pokergo/engine';
import type { Card } from '@pokergo/shared';
import { useMemo } from 'react';

interface Props {
  holeCards: readonly [Card, Card] | null;
  board: readonly Card[];
}

// HandStrengthBadge v3 — **浮世絵スタンプ verdict**:
//
//   役完成時、左に「朱印」(漢字 1 文字を赤い印章で押す) + 右に明朝大型タイトル。
//   ハンドの強さレベルで漢字 + 縁色を切替。
//   animate-stamp でスタンプ落下 + 振動。
//   pre-flop は非表示 (旧 iteration から維持)。
//
//   "Botanical Vault" のシグネチャ要素 #1。

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

// 役のレベルを表す漢字 1 文字 (印章用)。
// 慣習語ではなく "印" としての記号的選択。
const STAMP_CHAR: Record<string, string> = {
  'Royal Flush': '極',
  'Straight Flush': '連',
  'Four of a Kind': '四',
  'Full House': '満',
  Flush: '同',
  Straight: '直',
  'Three of a Kind': '参',
  'Two Pair': '双',
  Pair: '対',
  'High Card': '高',
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
        stamp: STAMP_CHAR[r.name] ?? '役',
        detail: r.description,
        level: STRENGTH_LEVEL[r.name] ?? 0,
      };
    } catch {
      return null;
    }
  }, [holeCards, board]);

  if (!info) return null;

  // 強さレベルで縁色を切替
  const strong = info.level >= 6;
  const high = info.level >= 3;
  const accentText = strong ? 'text-jade-glow' : 'text-brass';
  const borderTone = strong
    ? 'border-jade/55 shadow-[0_0_28px_rgba(110,231,183,0.25)]'
    : high
      ? 'border-brass/55 shadow-[0_8px_24px_-6px_rgba(245,215,122,0.4)]'
      : 'border-brass/30';

  // 朱印の key で再アニメ
  const stampKey = `${info.en}-${board.length}`;

  return (
    <output
      key={stampKey}
      className={`relative inline-flex items-center gap-3 px-3 py-2 rounded-md border-2 bg-gradient-to-b from-ink-deep/95 to-ink-abyss/95 paper-noise animate-stamp ${borderTone}`}
      aria-live="polite"
    >
      {/* 上下 brass の細線 (Vault 印章感) */}
      <div className="absolute top-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-brass/70 to-transparent" />
      <div className="absolute bottom-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-brass/70 to-transparent" />

      {/* 朱印 (Botanical Vault のシグネチャ) */}
      <div
        className="ink-seal w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center shrink-0 text-2xl sm:text-3xl"
        aria-hidden="true"
      >
        {info.stamp}
      </div>

      {/* 役名 */}
      <div className="flex flex-col items-start leading-tight">
        <span className={`font-jp font-bold text-base sm:text-lg ${accentText} tracking-wider`}>
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
