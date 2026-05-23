import type { Seat } from '@pokergo/shared';
import { useEffect, useState } from 'react';
import { useTableStore } from '../stores/tableStore';
import { ActionPanel } from './ActionPanel';
import { AnalysisPanel } from './AnalysisPanel';
import { Board } from './Board';
import { HandStrengthBadge } from './HandStrengthBadge';
import { SeatView } from './Seat';

// 楕円卓の 8 座席座標。視覚位置 0 = 自分 (下中央)。
// 仕様 §11.2.2 + Ten-Four 風: 大きく安定したレイアウト。
const VISUAL_POSITIONS: {
  top: string;
  left: string;
  position: 'top' | 'side' | 'bottom';
}[] = [
  { top: '92%', left: '50%', position: 'bottom' }, // 0: あなた
  { top: '78%', left: '18%', position: 'bottom' }, // 1
  { top: '42%', left: '6%', position: 'side' }, // 2
  { top: '12%', left: '20%', position: 'top' }, // 3
  { top: '4%', left: '50%', position: 'top' }, // 4
  { top: '12%', left: '80%', position: 'top' }, // 5
  { top: '42%', left: '94%', position: 'side' }, // 6
  { top: '78%', left: '82%', position: 'bottom' }, // 7
];

// felt: 緑のグラデーション + 木枠 + 微妙な光彩
const FELT_GRADIENT = 'radial-gradient(ellipse at 50% 35%, #266a4d 0%, #1a4d36 45%, #0d2a1d 100%)';

// yourSeat (実際の席番号) を視覚位置 0 (下) に対応付けるため、表示順序を回転する。
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
      <div className="flex items-center justify-center min-h-[40vh] text-sm text-slate-400">
        準備中…
      </div>
    );
  }

  const youWon = winners?.some((w) => w.seat === yourSeat) ?? false;
  const yourPlayer = state.players.get(yourSeat);
  const visualOrder = buildVisualOrder(yourSeat);

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* 卓情報バー */}
      <div className="text-[11px] text-slate-400 flex items-center gap-3 flex-wrap justify-center">
        <span>
          ハンド #{handsPlayed + 1} · {state.players.size} 人 · ブラインド {state.sb}/{state.bb}
        </span>
      </div>

      {/* 楕円卓 */}
      <div
        className="relative w-full max-w-4xl aspect-[5/4] sm:aspect-[16/10] rounded-[40%] sm:rounded-[35%] border-[6px] sm:border-8 border-amber-950 shadow-[0_15px_50px_-10px_rgba(0,0,0,0.7)] overflow-hidden"
        style={{ background: FELT_GRADIENT }}
      >
        {/* インナーリング (felt の段差) */}
        <div className="absolute inset-2 rounded-[38%] sm:rounded-[33%] border border-amber-800/30 pointer-events-none" />

        {/* 中央: Board + Pot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <Board state={state} />
        </div>

        {/* 席（自分が常に下） */}
        {VISUAL_POSITIONS.map((pos, idx) => {
          const seat = visualOrder[idx];
          if (seat === undefined) return null;
          const player = state.players.get(seat);
          const isYou = seat === yourSeat;
          const isToAct = state.toAct === seat;
          const isButton = state.buttonSeat === seat;
          const label = isYou ? 'あなた' : (cpuNames.get(seat) ?? `Seat ${seat}`);
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

      {/* あなたの役 (ハンド強度) */}
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

      {/* 勝者表示 */}
      {winners && showdownRevealed && (
        <div className="flex flex-col items-center gap-1">
          <div
            className={`text-base font-bold px-4 py-1.5 rounded-lg border ${
              youWon
                ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-200'
                : 'bg-slate-800/70 border-slate-700 text-slate-300'
            }`}
          >
            {youWon ? '🏆 あなたの勝ち！' : 'ハンド終了'}
          </div>
          <div className="text-[11px] text-slate-300 flex gap-2 flex-wrap justify-center max-w-md">
            {winners.map((w, i) => (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: 単純列挙
                key={i}
                className={`px-2 py-0.5 rounded ${
                  w.seat === yourSeat
                    ? 'bg-emerald-500/15 text-emerald-200'
                    : 'bg-slate-800 text-slate-200'
                }`}
              >
                seat {w.seat}: +{w.amount}
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
