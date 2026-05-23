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

// スタック表記を統一: 1k 未満は数字、それ以上は k 表記（小数点 1 桁、整数は省略）。
function shortStack(n: number): string {
  if (n >= 10_000) return `${Math.floor(n / 1000)}k`;
  if (n >= 1000) {
    const k = n / 1000;
    return Number.isInteger(k) ? `${k}k` : `${k.toFixed(1)}k`;
  }
  return n.toString();
}

// 空席プレースホルダ: 細い brass ring + 「空席」/"OPEN" のミニラベル。
// 旧 "seat 0" plain text の代替。auto-rebuy で常時 8 人を維持するので
// 通常は出現しないが、念のため refined fallback を残す。
function EmptySeat({ seat }: { seat: SeatType }) {
  return (
    <div className="w-20 h-20 rounded-full border border-brass/15 bg-ink-deepest/30 flex flex-col items-center justify-center opacity-50">
      <span className="font-display italic text-[10px] text-ivory-muted tracking-widest">
        seat {seat}
      </span>
      <span className="font-jp text-[9px] text-ivory-muted tracking-widest mt-0.5">空席</span>
    </div>
  );
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
  if (!player) return <EmptySeat seat={seat} />;

  const status = player.status;
  const reveal = isYou || (showdownRevealed && status !== 'folded');
  const folded = status === 'folded';
  const allin = status === 'allin';
  const cardSize = isYou ? 'md' : 'sm';

  // 状態フレーム:
  // - 手番中: brass の amber glow (act-pulse)
  // - 自分: ぼんやり brass border
  // - 通常: dark に控えめ border
  // - fold: 背景だけ薄暗くし、avatar/名前は読めるまま
  const frame = isToAct
    ? 'border-brass shadow-[0_0_0_2px_rgba(245,215,122,0.45),0_0_28px_rgba(245,215,122,0.4)] bg-gradient-to-b from-ink/95 to-felt-deep/90 animate-act'
    : isYou
      ? 'border-brass/40 bg-gradient-to-b from-ink-deep/95 to-ink/95'
      : folded
        ? 'border-ink-line/50 bg-gradient-to-b from-ink-deepest/70 to-ink-deep/60'
        : 'border-ink-line/70 bg-gradient-to-b from-ink-deep/90 to-ink/85';

  const avatarRing = isYou
    ? 'bg-gradient-to-br from-brass-light to-brass-deep text-ink-deepest'
    : folded
      ? 'bg-gradient-to-br from-ink-soft to-ink-line text-ivory-muted'
      : 'bg-gradient-to-br from-ink-soft to-ink-line text-bone';

  return (
    <div
      className={`relative flex flex-col items-center rounded-xl px-2 py-2 border-2 transition-all w-[110px] sm:w-[130px] ${frame}`}
    >
      {/* dealer ボタン: 席の外側右上に float */}
      {isButton && (
        <div
          className="absolute -top-3 -right-3 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-display font-bold bg-gradient-to-br from-brass-glow to-brass-deep text-ink-deepest border-2 border-ink-deep shadow-[0_2px_10px_rgba(245,215,122,0.7)] z-10"
          title="ディーラーボタン"
        >
          D
        </div>
      )}

      {/* avatar 行 */}
      <div className={`flex items-center gap-2 w-full ${folded ? 'opacity-70' : ''}`}>
        <div
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-display font-bold shrink-0 border border-brass/30 ${avatarRing}`}
        >
          {initial(label)}
        </div>
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
      </div>

      {/* カード: fold 時は薄く + 斜めに */}
      <div
        className={`flex gap-0.5 mt-1.5 ${isYou ? 'scale-105' : ''} ${
          folded ? 'opacity-30 rotate-3 scale-90' : ''
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

      {/* ステータスラベル: avatar の右上に重ねるのではなく、カード上に scotch tape 風に */}
      {folded && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 text-[9px] font-display font-bold tracking-widest text-crimson-glow bg-ink-deepest/85 border border-crimson/40 px-2 py-0.5 rounded -rotate-6">
          FOLD
        </div>
      )}
      {allin && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 text-[9px] font-display font-bold tracking-widest text-brass-glow bg-ink-deepest/90 border border-brass/60 px-2 py-0.5 rounded -rotate-3 shadow-[0_0_10px_rgba(245,215,122,0.5)]">
          ALL-IN
        </div>
      )}

      {/* 現ベット (chip pill, ink-deepest 背景で felt 上でも読める) */}
      {player.currentBet > 0 && !folded && (
        <div className="mt-1.5">
          <ChipStack amount={player.currentBet} compact />
        </div>
      )}

      {/* タイマー */}
      {isToAct && totalMs > 0 && (
        <div className="w-full mt-1.5">
          <TimerBar remainingMs={remainingMs} totalMs={totalMs} />
        </div>
      )}
    </div>
  );
}
