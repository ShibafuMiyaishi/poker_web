import type { Seat } from '@pokergo/shared';
import { serverDriver } from '../lib/serverDriver';
import { useTableStore } from '../stores/tableStore';

// サーバモードで自分が未着席のとき表示する「席に着く」操作。
export function SitPanel() {
  const state = useTableStore((s) => s.state);
  const mode = useTableStore((s) => s.mode);
  if (mode !== 'server' || !state) return null;

  // 自分が着席済みかは yourSeat ではなく state.players.has で判定するが、
  // tableStore.yourSeat を信頼する。state がまだ載っていなければ着席候補なし。
  const occupiedSeats = new Set<Seat>();
  for (const seat of state.players.keys()) occupiedSeats.add(seat);
  const emptySeats: Seat[] = [];
  for (let i = 0; i < 8; i++) {
    const s = i as Seat;
    if (!occupiedSeats.has(s)) emptySeats.push(s);
  }
  if (emptySeats.length === 0) return null;

  return (
    <div className="text-xs text-slate-300 mt-3 flex items-center gap-2">
      <span>空席:</span>
      {emptySeats.map((s) => (
        <button
          key={`sit-${s}`}
          type="button"
          onClick={() => serverDriver.sit(s)}
          className="px-2 py-1 rounded bg-accent hover:bg-blue-500 font-semibold"
        >
          seat {s}
        </button>
      ))}
    </div>
  );
}
