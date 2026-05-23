import type { Seat } from '@pokergo/shared';
import { serverDriver } from '../lib/serverDriver';
import { useTableStore } from '../stores/tableStore';

// サーバモードで自分が未着席のとき表示する「席に着く」操作。
export function SitPanel() {
  const state = useTableStore((s) => s.state);
  const mode = useTableStore((s) => s.mode);
  if (mode !== 'server' || !state) return null;

  const occupiedSeats = new Set<Seat>();
  for (const seat of state.players.keys()) occupiedSeats.add(seat);
  const emptySeats: Seat[] = [];
  for (let i = 0; i < 8; i++) {
    const s = i as Seat;
    if (!occupiedSeats.has(s)) emptySeats.push(s);
  }
  if (emptySeats.length === 0) return null;

  return (
    <div className="rounded-md border border-brass/25 bg-gradient-to-b from-ink-deep/95 to-ink/95 px-3 py-2 flex items-center gap-2 flex-wrap shadow-card">
      <span className="font-jp text-xs text-ivory-dim tracking-widest">空席</span>
      <span className="font-display italic text-[10px] text-brass tracking-widest uppercase opacity-70">
        open seats
      </span>
      <div className="flex gap-1.5 flex-wrap ml-2">
        {emptySeats.map((s) => (
          <button
            key={`sit-${s}`}
            type="button"
            onClick={() => serverDriver.sit(s)}
            className="px-3 py-1 rounded brass-surface text-xs font-display font-semibold tracking-widest hover:brightness-110 transition"
          >
            seat {s}
          </button>
        ))}
      </div>
    </div>
  );
}
