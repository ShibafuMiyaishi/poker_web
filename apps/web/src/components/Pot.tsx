import { useEffect, useState } from 'react';
import { formatChips } from '../lib/format';
import { useTableStore } from '../stores/tableStore';
import { ChipStack } from './Chip';

interface Props {
  amount: number;
  currentBet?: number;
  bb?: number;
  compact?: boolean;
}

// Pot v4 — 銅鏡 (bronze mirror):
//   円形 brass ring に "POT · ポット" を上弧刻印 + 内側に大型 brass-text 数字。
//   デスクトップで 200×116px、モバイルで 150×88px。
//   pot 変化時に pot-tick 微振動 + aria-live。
export function Pot({ amount, currentBet = 0, bb = 10, compact = false }: Props) {
  const [prev, setPrev] = useState(amount);
  const [tick, setTick] = useState(0);
  const bbDisplay = useTableStore((s) => s.bbDisplay);
  useEffect(() => {
    if (amount !== prev) {
      setPrev(amount);
      setTick((t) => t + 1);
    }
  }, [amount, prev]);

  const w = compact ? 150 : 200;
  const h = compact ? 88 : 116;
  const fontSize = compact ? 'text-3xl' : 'text-4xl sm:text-5xl';

  return (
    <div className="flex flex-col items-center select-none">
      <ChipStack amount={amount} showLabel={false} />
      <div className="relative mt-1.5 sm:mt-2">
        <svg
          width={w}
          height={h}
          viewBox="0 0 200 116"
          aria-hidden="true"
          className="drop-shadow-[0_6px_22px_rgba(0,0,0,0.55)]"
        >
          <defs>
            <linearGradient id="pot-ring" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fde68a" />
              <stop offset="50%" stopColor="#c89f48" />
              <stop offset="100%" stopColor="#6f5520" />
            </linearGradient>
            <radialGradient id="pot-inside" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#0c1a14" />
              <stop offset="100%" stopColor="#04070a" />
            </radialGradient>
            <path id="pot-arc-top" d="M 22 60 Q 100 -10 178 60" />
          </defs>
          {/* outer brass ring */}
          <ellipse cx="100" cy="58" rx="92" ry="48" fill="url(#pot-ring)" />
          {/* inner shadow band (depth) */}
          <ellipse cx="100" cy="58" rx="86" ry="42" fill="#04070a" opacity="0.5" />
          {/* inner dark */}
          <ellipse cx="100" cy="58" rx="84" ry="40" fill="url(#pot-inside)" />
          {/* inner thin brass line */}
          <ellipse
            cx="100"
            cy="58"
            rx="84"
            ry="40"
            fill="none"
            stroke="#c89f48"
            strokeWidth="0.8"
            opacity="0.55"
          />
          {/* 上弧に "· POT · ポット ·" を彫る */}
          <text
            fontSize="12"
            fontFamily="Fraunces, serif"
            fontWeight="700"
            fill="#f5d77a"
            letterSpacing="8"
          >
            <textPath href="#pot-arc-top" startOffset="50%" textAnchor="middle">
              · POT · ポット ·
            </textPath>
          </text>
        </svg>

        {/* 数字オーバーレイ */}
        <div
          key={`tick-${tick}`}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ paddingBottom: compact ? 6 : 10 }}
        >
          <span
            className={`brass-text font-display ${fontSize} font-bold tabular-nums leading-none animate-pot-tick`}
            aria-live="polite"
            aria-atomic="true"
          >
            {formatChips(amount, bb, bbDisplay)}
          </span>
        </div>
      </div>

      {/* to call */}
      {currentBet > 0 && (
        <div className="mt-1 inline-flex items-baseline gap-1.5 text-[10px] sm:text-xs tabular-nums">
          <span className="font-jp text-ivory-muted tracking-widest">コール</span>
          <span className="vermilion-text font-display font-bold text-base sm:text-lg">
            {formatChips(currentBet, bb, bbDisplay)}
          </span>
        </div>
      )}
    </div>
  );
}
