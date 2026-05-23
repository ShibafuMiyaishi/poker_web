import type { Seat } from '@pokergo/shared';
import { useEffect, useState } from 'react';
import { useTableStore } from '../stores/tableStore';
import { ActionPanel } from './ActionPanel';
import { AnalysisPanel } from './AnalysisPanel';
import { Board } from './Board';
import { HandStrengthBadge } from './HandStrengthBadge';
import { SeatView } from './Seat';
import { OrnamentFrame } from './primitives/Ornament';

// 楕円卓: 0 = 自分 (下中央) 〜 7 を時計回り。
const VISUAL_POSITIONS: { top: string; left: string; position: 'top' | 'side' | 'bottom' }[] = [
  { top: '92%', left: '50%', position: 'bottom' },
  { top: '78%', left: '15%', position: 'bottom' },
  { top: '42%', left: '4%', position: 'side' },
  { top: '10%', left: '18%', position: 'top' },
  { top: '2%', left: '50%', position: 'top' },
  { top: '10%', left: '82%', position: 'top' },
  { top: '42%', left: '96%', position: 'side' },
  { top: '78%', left: '85%', position: 'bottom' },
];

function buildVisualOrder(yourSeat: Seat, seatCount = 8): Seat[] {
  const order: Seat[] = [];
  for (let i = 0; i < seatCount; i++) {
    order.push(((yourSeat + i) % seatCount) as Seat);
  }
  return order;
}

export function Table() {
  const state = useTableStore((s) => s.state);
  const yourSeat = useTableStore((s) => s.yourSeat);
  const cpuNames = useTableStore((s) => s.cpuNames);
  const showdownRevealed = useTableStore((s) => s.showdownRevealed);
  const winners = useTableStore((s) => s.winners);
  const handsPlayed = useTableStore((s) => s.handsPlayed);
  const actionDeadline = useTableStore((s) => s.actionDeadline);
  const actionTotal = useTableStore((s) => s.actionTotalMs);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (actionDeadline === null) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [actionDeadline]);
  const remainingMs = actionDeadline !== null ? Math.max(0, actionDeadline - now) : 0;

  if (!state) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-sm text-ivory-dim">
        <span className="font-jp tracking-widest">準備中</span>
        <span className="ml-2 font-display italic text-brass">Preparing the table…</span>
      </div>
    );
  }

  const youWon = winners?.some((w) => w.seat === yourSeat) ?? false;
  const yourPlayer = state.players.get(yourSeat);
  const visualOrder = buildVisualOrder(yourSeat);

  return (
    <div className="flex flex-col items-center gap-3 sm:gap-4 w-full">
      {/* 卓ステータスバー */}
      <div className="text-[11px] text-ivory-dim flex items-center gap-4 flex-wrap justify-center brass-surface rounded-full px-4 py-1">
        <span className="font-display italic tracking-widest">
          Hand <span className="brass-text font-bold">#{handsPlayed + 1}</span>
        </span>
        <span className="opacity-50">·</span>
        <span className="font-jp tracking-wider">
          {state.players.size} <span className="text-ivory-muted">人</span>
        </span>
        <span className="opacity-50">·</span>
        <span className="font-mono-tabular tracking-wide">
          {state.sb}/{state.bb} <span className="text-ivory-muted">bb</span>
        </span>
      </div>

      {/* 楕円卓 */}
      <div className="relative w-full max-w-4xl">
        {/* brass rim outer */}
        <div className="relative w-full aspect-[5/4] sm:aspect-[16/10] rounded-[44%] sm:rounded-[38%] p-[6px] sm:p-[8px] brass-rim shadow-felt">
          {/* dark inner shadow ring */}
          <div className="absolute inset-[6px] sm:inset-[8px] rounded-[42%] sm:rounded-[36%] shadow-[inset_0_4px_10px_rgba(0,0,0,0.5)] pointer-events-none z-20" />

          {/* felt surface */}
          <div className="relative w-full h-full rounded-[42%] sm:rounded-[36%] felt-surface overflow-hidden">
            <OrnamentFrame size={28} inset={20} />

            {/* center: Board + Pot */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <Board state={state} />
            </div>

            {/* seats */}
            {VISUAL_POSITIONS.map((pos, idx) => {
              const seat = visualOrder[idx];
              if (seat === undefined) return null;
              const player = state.players.get(seat);
              const isYou = seat === yourSeat;
              const isToAct = state.toAct === seat;
              const isButton = state.buttonSeat === seat;
              const label = isYou ? 'You' : (cpuNames.get(seat) ?? `Seat ${seat}`);
              return (
                <div
                  key={seat}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-30"
                  style={{ top: pos.top, left: pos.left }}
                >
                  <SeatView
                    seat={seat}
                    player={player}
                    isYou={isYou}
                    isButton={isButton}
                    isToAct={isToAct}
                    showdownRevealed={showdownRevealed}
                    label={label}
                    remainingMs={isToAct ? remainingMs : 0}
                    totalMs={isToAct ? actionTotal : 0}
                    position={pos.position}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* あなたの役 (verdict card) */}
      {yourPlayer && (
        <HandStrengthBadge
          holeCards={
            yourPlayer.holeCards[0] && yourPlayer.holeCards[1]
              ? [yourPlayer.holeCards[0], yourPlayer.holeCards[1]]
              : null
          }
          board={state.board}
        />
      )}

      {/* 勝者ペナント */}
      {winners && showdownRevealed && (
        <div className="flex flex-col items-center gap-2 animate-verdict">
          <div
            className={`px-5 py-2 rounded-md border-2 font-display tracking-widest ${
              youWon
                ? 'bg-gradient-to-b from-jade/30 to-jade/10 border-jade/60 text-jade-glow shadow-[0_0_30px_rgba(110,231,183,0.3)]'
                : 'bg-gradient-to-b from-ink-deep to-ink border-brass/30 text-ivory-dim'
            }`}
          >
            <span className="text-base sm:text-lg font-bold">
              {youWon ? '✦ あなたの勝ち ✦' : 'Hand Concluded'}
            </span>
          </div>
          <div className="text-[11px] font-mono-tabular text-ivory-dim flex gap-2 flex-wrap justify-center max-w-md">
            {winners.map((w, i) => (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: 単純列挙
                key={i}
                className={`px-2 py-0.5 rounded border ${
                  w.seat === yourSeat
                    ? 'bg-jade/10 text-jade-glow border-jade/40'
                    : 'bg-ink-deep/70 text-ivory-dim border-ink-line/60'
                }`}
              >
                seat {w.seat} <span className="brass-text">+{w.amount}</span>
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
