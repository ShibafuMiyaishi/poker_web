import type { HandState } from '@pokergo/engine';
import type { Seat } from '@pokergo/shared';
import { actionJp, streetJp } from '../lib/pokerI18n';

interface Props {
  state: HandState;
  yourSeat: Seat;
  cpuNames: ReadonlyMap<Seat, string>;
  yourLabel: string;
}

// Action log: 最新 3 アクションをフィード表示。
// brand: brass の細いライン + 漢字 + chip 数字。
export function ActionLog({ state, yourSeat, cpuNames, yourLabel }: Props) {
  const recent = state.actions.slice(-3);
  if (recent.length === 0) return null;
  return (
    <div
      className="flex items-stretch gap-2 px-3 py-1.5 rounded-md border border-brass/25 bg-ink-deepest/70 backdrop-blur-sm shadow-card text-[10px] sm:text-[11px] max-w-xl mx-auto"
      aria-live="polite"
      aria-label="アクションログ"
    >
      <span className="font-jp text-ivory-muted tracking-widest shrink-0 self-center pr-2 border-r border-brass/20">
        履歴
      </span>
      <ol className="flex-1 flex flex-col gap-0.5">
        {recent.map((a, i) => {
          const last = i === recent.length - 1;
          const name = a.seat === yourSeat ? yourLabel : (cpuNames.get(a.seat) ?? `seat ${a.seat}`);
          return (
            <li
              // biome-ignore lint/suspicious/noArrayIndexKey: 表示順固定
              key={i}
              className={`flex items-baseline gap-1.5 ${last ? 'text-ivory' : 'text-ivory-muted opacity-70'}`}
            >
              <span className="font-jp text-[9px] text-ivory-muted w-12 shrink-0 truncate">
                {streetJp(a.street)}
              </span>
              <span
                className={`font-display truncate max-w-[100px] ${last ? 'text-brass-light' : ''}`}
              >
                {name}
              </span>
              <span className="font-jp">{actionJp(a.type)}</span>
              {a.amount > 0 && (
                <span className="font-mono-tabular text-brass ml-auto tabular-nums">
                  {a.amount.toLocaleString()}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
