import type { HandState } from '@pokergo/engine';
import type { Card as CardType } from '@pokergo/shared';
import { Card } from './Card';

export function Board({ state }: { state: HandState }) {
  const padded: (CardType | undefined)[] = [...state.board];
  while (padded.length < 5) padded.push(undefined);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-xs text-slate-400 tracking-wide uppercase">
        {state.street === 'showdown' ? 'showdown' : state.street}
      </div>
      <div className="flex gap-1">
        {padded.map((c, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: ボード固定 5 枠
          <Card key={i} card={c} hidden={!c} />
        ))}
      </div>
      <div className="text-sm text-slate-100 font-semibold">pot {state.pot}</div>
    </div>
  );
}
