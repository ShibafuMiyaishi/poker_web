import type { Seat } from '@pokergo/shared';
import { useTableStore } from '../stores/tableStore';
import { ActionPanel } from './ActionPanel';
import { AnalysisPanel } from './AnalysisPanel';
import { Board } from './Board';
import { SeatView } from './Seat';

// 8 席を楕円配置。自分（yourSeat）が下中央に来るよう視覚的に回転させる。
const VISUAL_POSITIONS: { top: string; left: string }[] = [
  { top: '88%', left: '50%' }, // 0: bottom-center (you)
  { top: '82%', left: '22%' }, // 1: bottom-left
  { top: '50%', left: '6%' }, // 2: middle-left
  { top: '14%', left: '22%' }, // 3: top-left
  { top: '5%', left: '50%' }, // 4: top-center
  { top: '14%', left: '78%' }, // 5: top-right
  { top: '50%', left: '94%' }, // 6: middle-right
  { top: '82%', left: '78%' }, // 7: bottom-right
];

export function Table() {
  const state = useTableStore((s) => s.state);
  const yourSeat = useTableStore((s) => s.yourSeat);
  const cpuNames = useTableStore((s) => s.cpuNames);
  const showdownRevealed = useTableStore((s) => s.showdownRevealed);
  const winners = useTableStore((s) => s.winners);
  const handsPlayed = useTableStore((s) => s.handsPlayed);

  if (!state) {
    return <div className="text-sm text-slate-400">準備中…</div>;
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-xs text-slate-400">
        hand #{handsPlayed + 1} · BTN seat {state.buttonSeat} · {state.players.size}人
      </div>

      <div className="relative w-full max-w-3xl aspect-[4/3] bg-felt rounded-[40%] border-4 border-amber-900/60 shadow-xl">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <Board state={state} />
        </div>
        {VISUAL_POSITIONS.map((pos, idx) => {
          const seat = idx as Seat;
          const player = state.players.get(seat);
          const isYou = seat === yourSeat;
          const toAct = state.toAct === seat;
          const label = isYou ? 'あなた' : (cpuNames.get(seat) ?? `seat ${seat}`);
          return (
            <div
              key={seat}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ top: pos.top, left: pos.left }}
            >
              <SeatView
                seat={seat}
                player={player}
                isYou={isYou}
                toAct={toAct}
                showdownRevealed={showdownRevealed}
                label={label}
              />
            </div>
          );
        })}
      </div>

      {winners && showdownRevealed && (
        <div className="text-sm text-slate-100 mt-2 flex gap-3 flex-wrap justify-center">
          {winners.map((w, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: 単純列挙
            <span key={i} className="px-2 py-1 rounded bg-win/20 border border-win/40">
              seat {w.seat} → +{w.amount} ({w.potLabel})
            </span>
          ))}
        </div>
      )}

      <ActionPanel />
      <AnalysisPanel />
    </div>
  );
}
