import type { HandPlayer } from '@pokergo/engine';
import type { Seat as SeatType } from '@pokergo/shared';
import { Card } from './Card';
import { ChipStack } from './Chip';
import { TimerBar } from './TimerBar';

interface Props {
  seat: SeatType;
  player: HandPlayer | undefined;
  isYou: boolean;
  isButton: boolean;
  isToAct: boolean;
  showdownRevealed: boolean;
  label: string;
  remainingMs: number;
  totalMs: number;
  position?: 'top' | 'side' | 'bottom';
}

function initial(label: string): string {
  return (label[0] ?? '?').toUpperCase();
}

function shortStack(n: number): string {
  if (n >= 10_000) return `${Math.floor(n / 1000)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

export function SeatView({
  seat,
  player,
  isYou,
  isButton,
  isToAct,
  showdownRevealed,
  label,
  remainingMs,
  totalMs,
}: Props) {
  if (!player) {
    return (
      <div className="text-[10px] text-ivory-muted px-2 py-1 rounded bg-ink-deep/60 border border-ink-line/60 w-20 text-center font-display italic">
        seat {seat}
      </div>
    );
  }

  const status = player.status;
  const reveal = isYou || (showdownRevealed && status !== 'folded');
  const folded = status === 'folded';
  const allin = status === 'allin';
  const cardSize = isYou ? 'md' : 'sm';

  // 状態ごとの枠線・glow
  const frame = isToAct
    ? 'border-brass/80 shadow-[0_0_0_2px_rgba(245,215,122,0.45),0_0_30px_rgba(245,215,122,0.35)] bg-gradient-to-b from-ink/95 to-felt-deep/90 animate-act'
    : isYou
      ? 'border-brass/35 bg-gradient-to-b from-ink-deep/95 to-ink/95'
      : 'border-ink-line/70 bg-gradient-to-b from-ink-deep/90 to-ink/85';

  const avatarRing = isYou
    ? 'bg-gradient-to-br from-brass-light to-brass-deep text-ink-deepest'
    : 'bg-gradient-to-br from-ink-soft to-ink-line text-bone';

  return (
    <div
      className={`relative flex flex-col items-center rounded-xl px-2 py-2 border-2 transition-all ${frame} ${
        folded ? 'opacity-45' : ''
      }`}
    >
      {/* button dealer marker (right corner) */}
      {isButton && (
        <div
          className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-display font-bold bg-gradient-to-br from-brass-glow to-brass-deep text-ink-deepest border-2 border-ink-deep shadow-[0_2px_8px_rgba(245,215,122,0.6)]"
          title="ディーラーボタン"
        >
          D
        </div>
      )}

      {/* avatar + name + stack */}
      <div className="flex items-center gap-2 w-full">
        <div
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-display font-bold shrink-0 border border-brass/30 ${avatarRing}`}
        >
          {initial(label)}
        </div>
        <div className="flex flex-col leading-tight min-w-0 flex-1">
          <div className="text-[11px] font-display font-semibold truncate text-ivory">{label}</div>
          <div className="text-[10px] font-mono-tabular text-brass tracking-wide">
            {shortStack(player.stack)}
          </div>
        </div>
      </div>

      {/* cards */}
      <div className={`flex gap-0.5 mt-1.5 ${isYou ? 'scale-105' : ''}`}>
        <div className="animate-deal">
          <Card
            card={reveal ? player.holeCards[0] : undefined}
            hidden={!reveal}
            size={cardSize}
            highlight={isToAct}
          />
        </div>
        <div className="animate-deal" style={{ animationDelay: '70ms' }}>
          <Card
            card={reveal ? player.holeCards[1] : undefined}
            hidden={!reveal}
            size={cardSize}
            highlight={isToAct}
          />
        </div>
      </div>

      {/* status overlay badges */}
      {folded && (
        <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[9px] font-display italic tracking-widest text-ivory-muted bg-ink-deepest/80 px-2 py-0.5 rounded">
          FOLD
        </div>
      )}
      {allin && (
        <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[9px] font-display font-bold tracking-widest text-brass-glow bg-ink-deepest/80 px-2 py-0.5 rounded border border-brass/40">
          ALL-IN
        </div>
      )}

      {/* current bet (chip + amount) */}
      {player.currentBet > 0 && (
        <div className="mt-1.5">
          <ChipStack amount={player.currentBet} compact />
        </div>
      )}

      {/* timer */}
      {isToAct && totalMs > 0 && (
        <div className="w-full mt-1.5">
          <TimerBar remainingMs={remainingMs} totalMs={totalMs} />
        </div>
      )}
    </div>
  );
}
