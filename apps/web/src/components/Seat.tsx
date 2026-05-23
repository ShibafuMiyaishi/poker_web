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
  // 配置位置: "top" / "bottom" でカード上方/下方の配置を変える
  position?: 'top' | 'side' | 'bottom';
}

// avatar 1 文字を seat 番号 or 名前から作る
function initial(label: string): string {
  return (label[0] ?? '?').toUpperCase();
}

// 数字を bb 単位の短縮表示（1000 → 1k）
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
  position = 'side',
}: Props) {
  if (!player) {
    return (
      <div className="text-[10px] text-slate-500 px-2 py-1 rounded bg-slate-900/40 border border-slate-800 w-20 text-center">
        seat {seat}
      </div>
    );
  }

  const status = player.status;
  const reveal = isYou || (showdownRevealed && status !== 'folded');
  const folded = status === 'folded';
  const allin = status === 'allin';

  const cardSize = isYou ? 'md' : 'sm';

  const ring = isToAct
    ? 'ring-2 ring-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.45)] bg-slate-900/95'
    : isYou
      ? 'ring-1 ring-blue-400/60 bg-slate-900/85'
      : 'ring-1 ring-slate-700 bg-slate-900/75';

  const avatarColor = isYou ? 'bg-blue-600' : 'bg-slate-700';

  return (
    <div
      className={`relative flex flex-col items-center rounded-xl px-2 py-2 transition-all ${ring} ${folded ? 'opacity-50' : ''}`}
    >
      {/* Avatar + 名前 + スタック */}
      <div className="flex items-center gap-2 w-full">
        <div
          className={`w-7 h-7 rounded-full ${avatarColor} flex items-center justify-center text-xs font-bold text-white shrink-0`}
        >
          {initial(label)}
        </div>
        <div className="flex flex-col leading-tight min-w-0">
          <div className="text-[11px] font-semibold truncate max-w-[80px]">{label}</div>
          <div className="text-[10px] text-slate-300 tabular-nums">{shortStack(player.stack)}</div>
        </div>
        {isButton && (
          <div
            className="ml-auto w-5 h-5 rounded-full bg-amber-300 text-slate-900 text-[10px] font-bold flex items-center justify-center shrink-0"
            title="ボタン"
          >
            D
          </div>
        )}
      </div>

      {/* カード */}
      <div className={`flex gap-0.5 ${position === 'top' ? 'mt-0.5 mb-1' : 'mt-1.5'}`}>
        <div className="animate-deal">
          <Card
            card={reveal ? player.holeCards[0] : undefined}
            hidden={!reveal}
            size={cardSize}
            highlight={isToAct}
          />
        </div>
        <div className="animate-deal" style={{ animationDelay: '60ms' }}>
          <Card
            card={reveal ? player.holeCards[1] : undefined}
            hidden={!reveal}
            size={cardSize}
            highlight={isToAct}
          />
        </div>
      </div>

      {/* ステータスバッジ */}
      {folded && (
        <div className="absolute top-1 right-2 text-[9px] font-bold text-slate-400 tracking-widest">
          FOLD
        </div>
      )}
      {allin && (
        <div className="absolute top-1 right-2 text-[9px] font-bold text-yellow-400 tracking-widest">
          ALL-IN
        </div>
      )}

      {/* 現ベット (chip stack) */}
      {player.currentBet > 0 && (
        <div className="mt-1">
          <ChipStack amount={player.currentBet} compact />
        </div>
      )}

      {/* タイマー */}
      {isToAct && totalMs > 0 && (
        <div className="w-full mt-1">
          <TimerBar remainingMs={remainingMs} totalMs={totalMs} />
        </div>
      )}
    </div>
  );
}
