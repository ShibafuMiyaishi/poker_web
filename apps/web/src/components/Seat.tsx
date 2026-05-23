import type { HandPlayer } from '@pokergo/engine';
import type { Seat as SeatType } from '@pokergo/shared';
import { Card } from './Card';
import { ChipStack } from './Chip';
import { TimerBar } from './TimerBar';
import { EmptySeatChair } from './primitives/EmptySeatChair';

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
  // モバイル時は seat box を小さくして board card との衝突を避ける
  compact?: boolean;
}

function initial(label: string): string {
  return (label[0] ?? '?').toUpperCase();
}

function shortStack(n: number): string {
  if (n >= 10_000) return `${Math.floor(n / 1000)}k`;
  if (n >= 1000) {
    const k = n / 1000;
    return Number.isInteger(k) ? `${k}k` : `${k.toFixed(1)}k`;
  }
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
  compact = false,
}: Props) {
  if (!player) return <EmptySeatChair seatNo={seat} />;

  const status = player.status;
  const reveal = isYou || (showdownRevealed && status !== 'folded');
  const folded = status === 'folded';
  const allin = status === 'allin';
  // モバイル: 自席のみ md、他席は xs。デスクトップ: 自席 md、他席 sm
  const cardSize = compact ? (isYou ? 'sm' : 'xs') : isYou ? 'md' : 'sm';
  const boxWidth = compact ? 'w-[76px]' : 'w-[110px] sm:w-[130px]';

  // 状態フレーム
  const frame = isToAct
    ? 'border-brass shadow-[0_0_0_2px_rgba(245,215,122,0.45),0_0_30px_rgba(245,215,122,0.4)] bg-gradient-to-b from-ink/95 to-felt-deep/90 animate-act'
    : isYou
      ? 'border-brass/45 bg-gradient-to-b from-ink-deep/95 to-ink/95'
      : folded
        ? 'border-ink-line/50 bg-gradient-to-b from-ink-deepest/75 to-ink-deep/65'
        : 'border-ink-line/70 bg-gradient-to-b from-ink-deep/92 to-ink/88';

  const avatarRing = isYou
    ? 'bg-gradient-to-br from-brass-light to-brass-deep text-ink-deepest'
    : folded
      ? 'bg-gradient-to-br from-ink-soft to-ink-line text-ivory-muted'
      : 'bg-gradient-to-br from-ink-soft to-ink-line text-bone';

  const avatarSize = compact ? 'w-6 h-6' : 'w-7 h-7 sm:w-8 sm:h-8';

  return (
    <div
      className={`relative flex flex-col items-center rounded-xl ${compact ? 'px-1.5 py-1.5' : 'px-2 py-2'} border-2 transition-all ${boxWidth} ${frame}`}
      aria-current={isToAct ? 'true' : undefined}
    >
      {/* dealer ボタン: 金庫ダイヤル風 (8 ノッチ + 大型 D) */}
      {isButton && (
        <div
          className={`absolute ${compact ? '-top-2.5 -right-2.5 w-6 h-6' : '-top-3 -right-3 w-8 h-8'} z-10 drop-shadow-[0_2px_10px_rgba(245,215,122,0.7)]`}
          aria-label="ディーラーボタン"
          title="ディーラー"
        >
          <svg viewBox="0 0 32 32" width="100%" height="100%" aria-hidden="true">
            <defs>
              <radialGradient id={`dl-${seat}`} cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#fde68a" />
                <stop offset="60%" stopColor="#c89f48" />
                <stop offset="100%" stopColor="#6f5520" />
              </radialGradient>
            </defs>
            <circle
              cx="16"
              cy="16"
              r="14"
              fill={`url(#dl-${seat})`}
              stroke="#04070a"
              strokeWidth="2"
            />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <rect
                key={deg}
                x="15"
                y="2"
                width="2"
                height="3"
                fill="#04070a"
                opacity="0.6"
                transform={`rotate(${deg} 16 16)`}
              />
            ))}
            <text
              x="16"
              y="21"
              textAnchor="middle"
              fontFamily="Fraunces, serif"
              fontWeight="900"
              fontSize="14"
              fill="#04070a"
            >
              D
            </text>
          </svg>
        </div>
      )}

      {/* avatar 行 */}
      <div className={`flex items-center gap-1.5 w-full ${folded ? 'opacity-70' : ''}`}>
        <div
          className={`${avatarSize} rounded-full flex items-center justify-center text-[10px] sm:text-xs font-display font-bold shrink-0 border border-brass/35 ${avatarRing}`}
          aria-hidden="true"
        >
          {initial(label)}
        </div>
        {!compact && (
          <div className="flex flex-col leading-tight min-w-0 flex-1">
            <div
              className={`text-[11px] font-display font-semibold truncate ${
                folded ? 'text-ivory-muted line-through decoration-crimson/50' : 'text-ivory'
              }`}
            >
              {label}
            </div>
            <div
              className={`text-[10px] font-mono-tabular tracking-wide tabular-nums ${
                folded ? 'text-ivory-muted' : 'text-brass'
              }`}
            >
              {shortStack(player.stack)}
            </div>
          </div>
        )}
        {compact && (
          <div
            className={`text-[9px] font-mono-tabular tabular-nums truncate ${
              folded ? 'text-ivory-muted' : 'text-brass'
            }`}
          >
            {shortStack(player.stack)}
          </div>
        )}
      </div>
      {compact && (
        <div
          className={`text-[9px] font-display font-semibold truncate w-full text-center mt-0.5 ${
            folded ? 'text-ivory-muted line-through' : 'text-ivory'
          }`}
        >
          {label}
        </div>
      )}

      {/* カード */}
      <div
        className={`flex gap-0.5 ${compact ? 'mt-1' : 'mt-1.5'} ${isYou ? 'scale-105' : ''} ${
          folded ? 'animate-fold' : ''
        }`}
      >
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

      {/* ステータスラベル */}
      {folded && (
        <div
          className={`absolute ${compact ? 'top-9 text-[8px] px-1.5' : 'top-12 text-[9px] px-2'} left-1/2 -translate-x-1/2 font-display font-bold tracking-widest text-crimson-glow bg-ink-deepest/90 border border-crimson/40 py-0.5 rounded -rotate-6 shadow-sm`}
        >
          FOLD
        </div>
      )}
      {allin && (
        <div
          className={`absolute ${compact ? 'top-9 text-[8px] px-1.5' : 'top-12 text-[9px] px-2'} left-1/2 -translate-x-1/2 font-display font-bold tracking-widest text-brass-glow bg-ink-deepest/90 border border-brass/60 py-0.5 rounded -rotate-3 shadow-[0_0_10px_rgba(245,215,122,0.5)]`}
        >
          ALL-IN
        </div>
      )}

      {/* 現ベット */}
      {player.currentBet > 0 && !folded && (
        <div className={compact ? 'mt-1' : 'mt-1.5'}>
          <ChipStack amount={player.currentBet} compact />
        </div>
      )}

      {/* タイマー */}
      {isToAct && totalMs > 0 && (
        <div className={`w-full ${compact ? 'mt-1' : 'mt-1.5'}`}>
          <TimerBar remainingMs={remainingMs} totalMs={totalMs} />
        </div>
      )}
    </div>
  );
}
