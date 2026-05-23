import { evaluateHand } from '@pokergo/engine';
import type { Card } from '@pokergo/shared';
import { useMemo } from 'react';

interface Props {
  holeCards: readonly [Card, Card] | null;
  board: readonly Card[];
}

// 役名を英語 → 日本語へ
const NAME_JA: Record<string, string> = {
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

const RANK_JA: Record<string, string> = {
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

// 自分のホールカード + 公開ボードから現在の最強役を表示する。
// 5 枚以上揃ったときのみ評価（プリフロップ時はホールカードのみのため非表示）。
export function HandStrengthBadge({ holeCards, board }: Props) {
  const info = useMemo(() => {
    if (!holeCards) return null;
    const all = [holeCards[0], holeCards[1], ...board];
    if (all.length < 5) {
      // プリフロップは "ハンド名のヒント" のみ表示（ペア/スーテッド/AKo 等）
      return { primary: previewHand(holeCards[0], holeCards[1]), secondary: 'プリフロップ' };
    }
    try {
      const r = evaluateHand(all);
      const primary = NAME_JA[r.name] ?? r.name;
      return { primary, secondary: r.description };
    } catch {
      return null;
    }
  }, [holeCards, board]);

  if (!info || !holeCards) return null;

  return (
    <div className="px-3 py-1.5 rounded-md bg-gradient-to-br from-blue-900/80 to-slate-900/80 border border-blue-700/60 text-center shadow-md">
      <div className="text-[10px] uppercase tracking-widest text-blue-300/80">あなたの役</div>
      <div className="text-base font-bold text-white">{info.primary}</div>
      {info.secondary && (
        <div className="text-[10px] text-slate-300/90 max-w-[200px] truncate">{info.secondary}</div>
      )}
    </div>
  );
}

function previewHand(a: Card, b: Card): string {
  const r1 = a[0];
  const r2 = b[0];
  if (!r1 || !r2) return '';
  if (r1 === r2) return `ペア (${RANK_JA[r1] ?? r1}${RANK_JA[r1] ?? r1})`;
  const suited = a[1] === b[1];
  const high = RANK_JA[r1] ?? r1;
  const low = RANK_JA[r2] ?? r2;
  return `${high}${low} ${suited ? 'スーテッド' : 'オフスーツ'}`;
}
