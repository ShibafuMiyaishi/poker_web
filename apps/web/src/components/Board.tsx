import type { HandState } from '@pokergo/engine';
import type { Card as CardType } from '@pokergo/shared';
import { Card } from './Card';
import { Pot } from './Pot';

// ストリート見出し: 漢字メインで簡潔に。
const STREET_JP: Record<string, string> = {
  preflop: 'プリフロップ',
  flop: 'フロップ',
  turn: 'ターン',
  river: 'リバー',
  showdown: 'ショウダウン',
};

interface Props {
  state: HandState;
  compact?: boolean;
}

export function Board({ state, compact = false }: Props) {
  const padded: (CardType | undefined)[] = [...state.board];
  while (padded.length < 5) padded.push(undefined);
  const label = STREET_JP[state.street] ?? state.street;
  const isShowdown = state.street === 'showdown';
  const cardSize = compact ? 'sm' : 'md';

  return (
    <div className="flex flex-col items-center gap-2">
      {/* ストリート見出し */}
      <div className="flex items-baseline gap-2 sm:gap-3">
        <div className="h-px w-8 sm:w-16 bg-gradient-to-r from-transparent to-brass/60" />
        <span className="font-jp text-xs sm:text-base text-bone tracking-widest font-medium">
          {label}
        </span>
        <div className="h-px w-8 sm:w-16 bg-gradient-to-l from-transparent to-brass/60" />
      </div>

      {/* ボード 5 枚: showdown 時は card-flip アニメ */}
      <div className="flex gap-1 sm:gap-2" aria-live="polite" aria-atomic="false">
        {padded.map((c, i) => (
          <div
            key={`board-${i}-${c ?? 'back'}`}
            className={c ? (isShowdown ? 'animate-flip' : 'animate-deal') : ''}
            style={c ? { animationDelay: `${i * 90}ms` } : undefined}
          >
            <Card card={c} hidden={!c} size={cardSize} />
          </div>
        ))}
      </div>

      <div className={compact ? 'mt-1' : 'mt-2'}>
        <Pot amount={state.pot} currentBet={state.currentBet} bb={state.bb} compact={compact} />
      </div>
    </div>
  );
}
