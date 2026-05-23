import type { HandState } from '@pokergo/engine';
import type { Card as CardType } from '@pokergo/shared';
import { Card } from './Card';
import { Pot } from './Pot';

// ストリート表示: 日本語 (明朝) + 英 (Fraunces italic)
const STREET: Record<string, { jp: string; en: string }> = {
  preflop: { jp: 'プリフロップ', en: 'Pre-Flop' },
  flop: { jp: 'フロップ', en: 'Flop' },
  turn: { jp: 'ターン', en: 'Turn' },
  river: { jp: 'リバー', en: 'River' },
  showdown: { jp: 'ショウダウン', en: 'Showdown' },
};

export function Board({ state }: { state: HandState }) {
  const padded: (CardType | undefined)[] = [...state.board];
  while (padded.length < 5) padded.push(undefined);
  const meta = STREET[state.street] ?? { jp: state.street, en: state.street };

  return (
    <div className="flex flex-col items-center gap-2">
      {/* ストリートラベル: 二言語、brass ライン入り */}
      <div className="flex items-baseline gap-3 mb-1">
        <div className="h-px w-8 bg-gradient-to-r from-transparent to-brass/60" />
        <span className="font-jp text-sm sm:text-base text-bone tracking-widest">{meta.jp}</span>
        <span className="font-display italic text-[10px] sm:text-[11px] text-brass tracking-ultra uppercase">
          {meta.en}
        </span>
        <div className="h-px w-8 bg-gradient-to-l from-transparent to-brass/60" />
      </div>

      {/* ボード 5 枚 */}
      <div className="flex gap-1.5 sm:gap-2">
        {padded.map((c, i) => (
          <div
            key={`board-${i}-${c ?? 'back'}`}
            className={c ? 'animate-deal' : ''}
            style={c ? { animationDelay: `${i * 90}ms` } : undefined}
          >
            <Card card={c} hidden={!c} size="md" />
          </div>
        ))}
      </div>

      <div className="mt-2">
        <Pot amount={state.pot} currentBet={state.currentBet} />
      </div>
    </div>
  );
}
