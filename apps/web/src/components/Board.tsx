import type { HandState } from '@pokergo/engine';
import type { Card as CardType } from '@pokergo/shared';
import { Card } from './Card';
import { Pot } from './Pot';

const STREET_LABEL: Record<string, string> = {
  preflop: 'プリフロップ',
  flop: 'フロップ',
  turn: 'ターン',
  river: 'リバー',
  showdown: 'ショウダウン',
};

export function Board({ state }: { state: HandState }) {
  const padded: (CardType | undefined)[] = [...state.board];
  while (padded.length < 5) padded.push(undefined);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-[10px] sm:text-[11px] font-semibold tracking-widest uppercase text-slate-300/90">
        {STREET_LABEL[state.street] ?? state.street}
      </div>
      <div className="flex gap-1 sm:gap-1.5">
        {padded.map((c, i) => (
          <div
            key={`board-${i}-${c ?? 'back'}`}
            className={c ? 'animate-deal' : ''}
            style={c ? { animationDelay: `${i * 80}ms` } : undefined}
          >
            <Card card={c} hidden={!c} size="md" />
          </div>
        ))}
      </div>
      <div className="mt-1">
        <Pot amount={state.pot} currentBet={state.currentBet} />
      </div>
    </div>
  );
}
