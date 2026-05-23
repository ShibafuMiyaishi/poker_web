import { evaluateHand } from '@pokergo/engine';
import type { Card } from '@pokergo/shared';
import { useMemo } from 'react';

interface Props {
  holeCards: readonly [Card, Card] | null;
  board: readonly Card[];
}

// 日本のポーカー慣習に従い、カタカナ役名のみを使う。
// (前回の「同色」「対子」等の造語漢字は完全に削除)
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

// 役の強さ階層: 0 (High Card) 〜 9 (Royal Flush) を取り出して色を決める
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

// 役の評価は **フロップ以降** のみ。プリフロップで弱手 (52s 等) を
// "verdict" として誇張表示すると UX が悪い (PokerStars / GG も pre-flop は出さない or 極小)。
export function HandStrengthBadge({ holeCards, board }: Props) {
  const info = useMemo(() => {
    if (!holeCards) return null;
    if (board.length < 3) return null; // pre-flop は非表示

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

  // 役の強さで色を変える: 弱(灰)→中(brass)→強(jade)→極上(brass-glow)
  const tone =
    info.level >= 6
      ? 'border-jade/60 bg-gradient-to-b from-jade/20 to-ink-deep/95 shadow-[0_0_24px_rgba(110,231,183,0.25)]'
      : info.level >= 3
        ? 'border-brass/50 bg-gradient-to-b from-ink-deep/95 to-ink-deepest/95 shadow-verdict'
        : 'border-brass/25 bg-gradient-to-b from-ink-deep/95 to-ink/95';

  const accentText = info.level >= 6 ? 'text-jade-glow' : 'text-brass';

  return (
    <div
      className={`inline-flex items-baseline gap-3 px-4 py-1.5 rounded border ${tone} animate-verdict`}
    >
      <span className={`font-jp text-sm sm:text-base ${accentText} tracking-wider`}>{info.jp}</span>
      <span className="text-ivory-muted">·</span>
      <span className="font-display italic text-[11px] text-ivory-dim tracking-widest uppercase">
        {info.en}
      </span>
      {info.detail && (
        <span className="hidden sm:inline text-[10px] text-ivory-muted font-mono-tabular truncate max-w-[180px]">
          {info.detail}
        </span>
      )}
    </div>
  );
}
