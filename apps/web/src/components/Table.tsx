import type { Seat } from '@pokergo/shared';
import { useEffect, useState } from 'react';
import { useTableStore } from '../stores/tableStore';
import { ActionPanel } from './ActionPanel';
import { AnalysisPanel } from './AnalysisPanel';
import { Board } from './Board';
import { SeatView } from './Seat';

// 8 席を楕円配置。自分（yourSeat = 0）が下中央に来る前提。
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

const FELT_GRADIENT = 'radial-gradient(ellipse at center, #1f5742 0%, #143a2c 60%, #0a1f17 100%)';

export function Table() {
  const state = useTableStore((s) => s.state);
  const yourSeat = useTableStore((s) => s.yourSeat);
  const cpuNames = useTableStore((s) => s.cpuNames);
  const showdownRevealed = useTableStore((s) => s.showdownRevealed);
  const winners = useTableStore((s) => s.winners);
  const handsPlayed = useTableStore((s) => s.handsPlayed);
  const actionDeadline = useTableStore((s) => s.actionDeadline);
  const actionTotal = useTableStore((s) => s.actionTotalMs);

  // 1 ティック毎にカウントダウン用 remainingMs を再計算する。
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (actionDeadline === null) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [actionDeadline]);
  const remainingMs = actionDeadline !== null ? Math.max(0, actionDeadline - now) : 0;

  if (!state) {
    return <div className="text-sm text-slate-400">準備中…</div>;
  }

  const youWon = winners?.some((w) => w.seat === yourSeat) ?? false;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-xs text-slate-400">
        hand #{handsPlayed + 1} · BTN seat {state.buttonSeat} · {state.players.size}人
      </div>

      <div
        className="relative w-full max-w-3xl aspect-[4/3] rounded-[40%] border-4 border-amber-900/60 shadow-2xl overflow-hidden"
        style={{ background: FELT_GRADIENT }}
      >
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
                remainingMs={toAct ? remainingMs : 0}
                totalMs={toAct ? actionTotal : 0}
              />
            </div>
          );
        })}
      </div>

      {winners && showdownRevealed && (
        <div className="mt-2 flex flex-col items-center gap-1">
          <div
            className={`text-sm font-bold px-3 py-1 rounded ${youWon ? 'bg-win/30 border border-win' : 'bg-slate-800/70 border border-slate-700'}`}
          >
            {youWon ? '🏆 あなたの勝ち' : '次のハンドへ…'}
          </div>
          <div className="text-xs text-slate-100 flex gap-3 flex-wrap justify-center">
            {winners.map((w, i) => (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: 単純列挙
                key={i}
                className={`px-2 py-1 rounded border ${w.seat === yourSeat ? 'bg-win/20 border-win/40' : 'bg-slate-900/40 border-slate-700'}`}
              >
                seat {w.seat} → +{w.amount} ({w.potLabel})
              </span>
            ))}
          </div>
        </div>
      )}

      <ActionPanel />
      <AnalysisPanel />
    </div>
  );
}
