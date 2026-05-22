import type { HandPlayer } from '@pokergo/engine';
import type { Seat as SeatType } from '@pokergo/shared';
import { Card } from './Card';
import { ChipStack } from './Chip';
import { TimerBar } from './TimerBar';

interface Props {
  seat: SeatType;
  player: HandPlayer | undefined;
  isYou: boolean;
  toAct: boolean;
  showdownRevealed: boolean;
  label: string;
  remainingMs: number;
  totalMs: number;
}

export function SeatView({
  seat,
  player,
  isYou,
  toAct,
  showdownRevealed,
  label,
  remainingMs,
  totalMs,
}: Props) {
  if (!player) {
    return (
      <div className="text-[11px] text-slate-500 px-2 py-1 rounded bg-slate-900/40 border border-slate-800">
        seat {seat} 不在
      </div>
    );
  }

  const statusBadge = (() => {
    if (player.status === 'folded') return <span className="text-slate-400 text-[11px]">FOLD</span>;
    if (player.status === 'allin')
      return <span className="text-yellow-400 text-[11px] font-semibold">ALL-IN</span>;
    return null;
  })();

  const revealCards = isYou || (showdownRevealed && player.status !== 'folded');

  return (
    <div
      className={[
        'relative flex flex-col items-center gap-1 rounded-lg px-2 py-1.5 border w-24 sm:w-28',
        toAct ? 'border-accent bg-slate-800/90 animate-act' : 'border-slate-700 bg-slate-900/70',
        player.status === 'folded' ? 'opacity-50' : '',
      ].join(' ')}
    >
      <div className="text-[11px] font-medium tracking-tight truncate w-full text-center">
        {label}
      </div>
      <div className="flex gap-0.5">
        <div className="animate-deal">
          <Card
            card={revealCards ? player.holeCards[0] : undefined}
            hidden={!revealCards}
            size="sm"
          />
        </div>
        <div className="animate-deal" style={{ animationDelay: '60ms' }}>
          <Card
            card={revealCards ? player.holeCards[1] : undefined}
            hidden={!revealCards}
            size="sm"
          />
        </div>
      </div>
      <div className="text-[11px] text-slate-300">stack {player.stack}</div>
      {player.currentBet > 0 && <ChipStack amount={player.currentBet} />}
      <div className="text-[11px] h-4">{statusBadge}</div>
      {toAct && totalMs > 0 && <TimerBar remainingMs={remainingMs} totalMs={totalMs} />}
    </div>
  );
}
