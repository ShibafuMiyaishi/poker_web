import type { HandPlayer } from '@pokergo/engine';
import type { Seat as SeatType } from '@pokergo/shared';
import { Card } from './Card';

interface Props {
  seat: SeatType;
  player: HandPlayer | undefined;
  isYou: boolean;
  toAct: boolean;
  showdownRevealed: boolean;
  label: string; // CPU name or "あなた"
}

export function SeatView({ seat, player, isYou, toAct, showdownRevealed, label }: Props) {
  if (!player) {
    return (
      <div className="text-xs text-slate-500 px-2 py-1 rounded bg-slate-900/40 border border-slate-800">
        seat {seat} 不在
      </div>
    );
  }

  const statusBadge = (() => {
    if (player.status === 'folded') return <span className="text-slate-400">FOLD</span>;
    if (player.status === 'allin') return <span className="text-yellow-400">ALL-IN</span>;
    if (player.currentBet > 0) return <span className="text-accent">bet {player.currentBet}</span>;
    return null;
  })();

  const revealCards = isYou || (showdownRevealed && player.status !== 'folded');

  return (
    <div
      className={[
        'flex flex-col items-center gap-1 rounded-lg px-3 py-2 border w-28',
        toAct
          ? 'border-accent bg-slate-800/80 shadow-[0_0_0_2px_rgba(59,130,246,0.5)]'
          : 'border-slate-700 bg-slate-900/70',
        player.status === 'folded' ? 'opacity-50' : '',
      ].join(' ')}
    >
      <div className="text-xs font-medium tracking-tight">{label}</div>
      <div className="flex gap-1">
        <Card card={revealCards ? player.holeCards[0] : undefined} hidden={!revealCards} />
        <Card card={revealCards ? player.holeCards[1] : undefined} hidden={!revealCards} />
      </div>
      <div className="text-[11px] text-slate-300">stack {player.stack}</div>
      <div className="text-[11px] h-4">{statusBadge}</div>
    </div>
  );
}
