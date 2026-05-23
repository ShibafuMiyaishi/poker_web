import { useEffect, useState } from 'react';
import { ChipStack } from './Chip';

interface Props {
  amount: number;
  currentBet?: number;
}

// Pot v3 — 銅鏡 (bronze mirror) スタイル:
//   円形 brass ring + ring 上に「POT」刻印 + 内側に大型数字。
//   数字変化時に微振動 (pot-tick)。
//   aria-live で読み上げ。
export function Pot({ amount, currentBet = 0 }: Props) {
  // 直前 amount を覚えておき、変化時だけアニメ
  const [prev, setPrev] = useState(amount);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (amount !== prev) {
      setPrev(amount);
      setTick((t) => t + 1);
    }
  }, [amount, prev]);

  // 短く tick して反復可能にする key
  const tickKey = `tick-${tick}`;

  return (
    <div className="flex flex-col items-center select-none">
      {/* チップ pile (背景的) */}
      <ChipStack amount={amount} showLabel={false} />

      {/* 銅鏡: SVG arc に "POT" を曲げて刻印 */}
      <div className="relative mt-2 flex flex-col items-center">
        <svg width="0" height="0" className="absolute" aria-hidden="true">
          <defs>
            <path id="pot-arc" d="M 10 60 Q 70 0 130 60" />
          </defs>
        </svg>

        <div className="relative">
          {/* 円形 brass ring */}
          <svg
            width="160"
            height="92"
            viewBox="0 0 160 92"
            aria-hidden="true"
            className="drop-shadow-[0_6px_18px_rgba(0,0,0,0.5)]"
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
              <path id="pot-arc-top" d="M 16 50 Q 80 -4 144 50" />
            </defs>
            {/* outer ring */}
            <ellipse cx="80" cy="46" rx="74" ry="38" fill="url(#pot-ring)" />
            {/* inner dark */}
            <ellipse cx="80" cy="46" rx="68" ry="32" fill="url(#pot-inside)" />
            {/* inner brass thin line */}
            <ellipse
              cx="80"
              cy="46"
              rx="68"
              ry="32"
              fill="none"
              stroke="#c89f48"
              strokeWidth="0.6"
              opacity="0.5"
            />
            {/* 「P O T · ポ ッ ト」を上弧に刻印 */}
            <text
              fontSize="9"
              fontFamily="Fraunces, serif"
              fontWeight="700"
              fill="#f5d77a"
              letterSpacing="6"
            >
              <textPath href="#pot-arc-top" startOffset="50%" textAnchor="middle">
                · POT · ポット ·
              </textPath>
            </text>
          </svg>

          {/* 数字オーバーレイ: tick で微振動 */}
          <div
            key={tickKey}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ paddingBottom: 8 }}
          >
            <span
              className="brass-text font-display text-3xl sm:text-4xl font-bold tabular-nums leading-none animate-pot-tick"
              aria-live="polite"
              aria-atomic="true"
            >
              {amount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* to call の表示 (cool counterpoint: vermilion accent) */}
        {currentBet > 0 && (
          <div className="mt-1 inline-flex items-baseline gap-1.5 text-[10px] tabular-nums">
            <span className="font-jp text-ivory-muted tracking-widest">コール</span>
            <span className="vermilion-text font-display font-bold text-base">
              {currentBet.toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
