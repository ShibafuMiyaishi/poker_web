import type { Seat } from '@pokergo/shared';
import { useEffect, useState } from 'react';
import { getStoredUser } from '../lib/auth';
import { useTableStore } from '../stores/tableStore';
import { ActionPanel } from './ActionPanel';
import { AnalysisPanel } from './AnalysisPanel';
import { Board } from './Board';
import { HandStrengthBadge } from './HandStrengthBadge';
import { SeatView } from './Seat';
import { OrnamentFrame } from './primitives/Ornament';

// 楕円卓: visualOrder[0] = 自分 (下中央)、以降時計回り。
// 席は brass-rim wrapper の絶対子要素として配置するため、felt の
// overflow:hidden に巻き込まれず縁で食われない。
const VISUAL_POSITIONS: { top: string; left: string; position: 'top' | 'side' | 'bottom' }[] = [
  { top: '93%', left: '50%', position: 'bottom' }, // 0: あなた (bottom-center)
  { top: '77%', left: '14%', position: 'bottom' }, // 1
  { top: '42%', left: '2%', position: 'side' }, // 2
  { top: '8%', left: '14%', position: 'top' }, // 3
  { top: '-4%', left: '50%', position: 'top' }, // 4: top-center
  { top: '8%', left: '86%', position: 'top' }, // 5
  { top: '42%', left: '98%', position: 'side' }, // 6
  { top: '77%', left: '86%', position: 'bottom' }, // 7
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
  const user = getStoredUser();
  const yourLabel = user?.handle ?? 'あなた';

  return (
    <div className="flex flex-col items-center gap-3 sm:gap-5 w-full">
      {/* 卓情報バー: 横長フラットで brass の細線で区切る */}
      <div className="inline-flex items-stretch divide-x divide-brass/25 border border-brass/30 rounded bg-gradient-to-b from-ink-deep/90 to-ink/90 text-[11px] sm:text-xs shadow-card">
        <div className="px-3 sm:px-4 py-1.5 flex items-baseline gap-2">
          <span className="font-jp text-ivory-muted tracking-widest">ハンド</span>
          <span className="brass-text font-display font-bold tabular-nums">#{handsPlayed + 1}</span>
        </div>
        <div className="px-3 sm:px-4 py-1.5 flex items-baseline gap-2">
          <span className="font-jp text-ivory-muted tracking-widest">参加</span>
          <span className="text-ivory font-mono-tabular tabular-nums">{state.players.size}</span>
          <span className="font-jp text-ivory-muted">人</span>
        </div>
        <div className="px-3 sm:px-4 py-1.5 flex items-baseline gap-2">
          <span className="font-jp text-ivory-muted tracking-widest">ブラインド</span>
          <span className="text-ivory font-mono-tabular tabular-nums">
            {state.sb}/{state.bb}
          </span>
        </div>
      </div>

      {/* 楕円卓フレーム: brass-rim + felt + 席 (席は overflow の影響を受けない) */}
      <div className="relative w-full max-w-4xl aspect-[16/11] sm:aspect-[16/9]">
        {/* brass rim + felt (両方 clip 内) */}
        <div className="absolute inset-0 rounded-[44%] sm:rounded-[40%] p-[6px] sm:p-[8px] brass-rim shadow-felt">
          <div className="relative w-full h-full rounded-[42%] sm:rounded-[38%] felt-surface overflow-hidden">
            {/* ornament 4 隅 (felt 内に収まる) */}
            <OrnamentFrame size={26} inset={26} />
            {/* 内 shadow ring */}
            <div className="absolute inset-0 rounded-[100%] shadow-[inset_0_4px_14px_rgba(0,0,0,0.55)] pointer-events-none" />
          </div>
        </div>

        {/* Board: 中央、felt の上に float */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <Board state={state} />
        </div>

        {/* 席: brass-rim wrapper の絶対子。felt の overflow:hidden に巻き込まれない */}
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

      {/* あなたの役 (verdict) — フロップ以降のみ */}
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
