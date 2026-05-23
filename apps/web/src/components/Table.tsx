import type { Seat } from '@pokergo/shared';
import { useEffect, useState } from 'react';
import { getStoredUser } from '../lib/auth';
import { useTableStore } from '../stores/tableStore';
import { ActionPanel } from './ActionPanel';
import { AnalysisPanel } from './AnalysisPanel';
import { Board } from './Board';
import { HandStrengthBadge } from './HandStrengthBadge';
import { SeatView } from './Seat';
import { VineFrame } from './primitives/VineCorner';

// 楕円卓レイアウト: 自席 = 視覚位置 0 (下中央)、時計回り。
// 席は brass-rim wrapper の絶対子として配置 → felt の overflow:hidden に巻き込まれない。
const VISUAL_POSITIONS: { top: string; left: string; position: 'top' | 'side' | 'bottom' }[] = [
  { top: '93%', left: '50%', position: 'bottom' },
  { top: '77%', left: '14%', position: 'bottom' },
  { top: '42%', left: '2%', position: 'side' },
  { top: '8%', left: '14%', position: 'top' },
  { top: '-4%', left: '50%', position: 'top' },
  { top: '8%', left: '86%', position: 'top' },
  { top: '42%', left: '98%', position: 'side' },
  { top: '77%', left: '86%', position: 'bottom' },
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
      </div>
    );
  }

  const youWon = winners?.some((w) => w.seat === yourSeat) ?? false;
  const yourPlayer = state.players.get(yourSeat);
  const visualOrder = buildVisualOrder(yourSeat);
  const user = getStoredUser();
  const yourLabel = user?.handle ?? 'あなた';

  return (
    <div className="flex flex-col items-center gap-3 sm:gap-5 w-full">
      {/* 卓情報バー: 帳簿風 (左 brass mark + 細い数字メタリスト) */}
      <div className="flex items-stretch border border-brass/30 rounded-md bg-ink-deepest/70 backdrop-blur-sm overflow-hidden shadow-card text-[11px] sm:text-xs">
        {/* 左 brass tag */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-b from-brass-deep/40 to-brass-deep/10 border-r border-brass/30">
          <span className="font-display italic text-[10px] text-brass tracking-widest uppercase">
            Hand
          </span>
          <span className="brass-text font-display font-bold tabular-nums text-sm">
            #{handsPlayed + 1}
          </span>
        </div>
        <div className="px-3 sm:px-4 py-1.5 flex items-baseline gap-1.5 border-r border-brass/15">
          <span className="text-ivory font-mono-tabular tabular-nums font-semibold">
            {state.players.size}
          </span>
          <span className="font-jp text-ivory-muted text-[10px]">人</span>
        </div>
        <div className="px-3 sm:px-4 py-1.5 flex items-baseline gap-1.5">
          <span className="font-jp text-ivory-muted text-[10px] tracking-widest">SB/BB</span>
          <span className="text-ivory font-mono-tabular tabular-nums">
            {state.sb}/{state.bb}
          </span>
        </div>
      </div>

      {/* 楕円卓 */}
      <div className="relative w-full max-w-4xl aspect-[16/11] sm:aspect-[16/9]">
        {/* brass rim + felt */}
        <div className="absolute inset-0 rounded-[44%] sm:rounded-[40%] p-[6px] sm:p-[8px] brass-rim shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)]">
          <div className="relative w-full h-full rounded-[42%] sm:rounded-[38%] felt-surface overflow-hidden">
            <VineFrame size={40} inset={28} />
          </div>
        </div>

        {/* Board (中央) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <Board state={state} />
        </div>

        {/* 席 (brass-rim 外側、clip 影響なし) */}
        {VISUAL_POSITIONS.map((pos, idx) => {
          const seat = visualOrder[idx];
          if (seat === undefined) return null;
          const player = state.players.get(seat);
          const isYou = seat === yourSeat;
          const isToAct = state.toAct === seat;
          const isButton = state.buttonSeat === seat;
          const label = isYou ? yourLabel : (cpuNames.get(seat) ?? `Seat ${seat}`);
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

      {/* あなたの役 (浮世絵スタンプ) */}
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

      {/* 勝者ペナント — winner-halo アニメ付き */}
      {winners && showdownRevealed && (
        <output className="flex flex-col items-center gap-2 animate-stamp" aria-live="polite">
          <div
            className={`px-5 py-2 rounded-md border-2 font-display tracking-widest ${
              youWon
                ? 'bg-gradient-to-b from-jade/30 to-jade/10 border-jade/60 text-jade-glow animate-winner'
                : 'bg-gradient-to-b from-ink-deep to-ink border-brass/30 text-ivory-dim'
            }`}
          >
            <span className="text-base sm:text-lg font-bold">
              {youWon ? '✦ あなたの勝利 ✦' : 'ハンド終了'}
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
        </output>
      )}

      <ActionPanel />
      <AnalysisPanel />
    </div>
  );
}
