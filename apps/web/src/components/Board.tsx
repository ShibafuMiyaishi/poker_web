import type { HandState } from '@pokergo/engine';
import type { Card as CardType } from '@pokergo/shared';
import { Card } from './Card';
import { Chip } from './Chip';

export function Board({ state }: { state: HandState }) {
  const padded: (CardType | undefined)[] = [...state.board];
  while (padded.length < 5) padded.push(undefined);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-[11px] text-slate-400 tracking-widest uppercase">
        {state.street === 'showdown' ? 'showdown' : state.street}
      </div>
      <div className="flex gap-1">
        {padded.map((c, i) => (
          <div
            key={`board-${i}-${c ?? 'back'}`}
            className={c ? 'animate-deal' : ''}
            style={c ? { animationDelay: `${i * 80}ms` } : undefined}
          >
            <Card card={c} hidden={!c} />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-1">
        <Chip amount={state.pot} size={20} />
        <span className="text-sm text-slate-100 font-semibold">pot {state.pot}</span>
      </div>
    </div>
  );
}
