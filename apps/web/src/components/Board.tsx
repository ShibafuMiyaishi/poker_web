import type { HandState } from '@pokergo/engine';
import type { Card as CardType } from '@pokergo/shared';
import { Card } from './Card';
import { Pot } from './Pot';

// ストリート見出し: 漢字メインで簡潔に。en は H1 のみ。
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
  const isShowdown = state.street === 'showdown';

  return (
    <div className="flex flex-col items-center gap-2">
      {/* ストリート見出し: 細 brass 線で挟む */}
      <div className="flex items-baseline gap-3">
        <div className="h-px w-12 sm:w-16 bg-gradient-to-r from-transparent to-brass/60" />
        <span className="font-jp text-sm sm:text-base text-bone tracking-widest font-medium">
          {meta.jp}
        </span>
        <div className="h-px w-12 sm:w-16 bg-gradient-to-l from-transparent to-brass/60" />
      </div>

      {/* ボード 5 枚: showdown 時は card-flip アニメ */}
      <div className="flex gap-1.5 sm:gap-2" aria-live="polite" aria-atomic="false">
        {padded.map((c, i) => (
          <div
            key={`board-${i}-${c ?? 'back'}`}
            className={c ? (isShowdown ? 'animate-flip' : 'animate-deal') : ''}
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
