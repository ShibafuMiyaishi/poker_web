interface Props {
  amount: number;
  size?: number;
}

// チップ色: 額面で 4 段階に色分け（PokerStars 風）。
function chipColors(amount: number): { base: string; ring: string } {
  if (amount >= 500) return { base: '#1f2937', ring: '#fbbf24' }; // 黒/金
  if (amount >= 100) return { base: '#15803d', ring: '#86efac' }; // 緑
  if (amount >= 25) return { base: '#1d4ed8', ring: '#93c5fd' }; // 青
  if (amount >= 5) return { base: '#b91c1c', ring: '#fca5a5' }; // 赤
  return { base: '#475569', ring: '#cbd5e1' }; // 灰 (小額)
}

export function Chip({ amount, size = 22 }: Props) {
  const { base, ring } = chipColors(amount);
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className="drop-shadow"
      role="img"
      aria-label={`chip ${amount}`}
    >
      <circle cx="16" cy="16" r="14" fill={base} />
      {/* 縞模様 6 本 */}
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <rect
          key={deg}
          x="14"
          y="1"
          width="4"
          height="6"
          fill={ring}
          transform={`rotate(${deg} 16 16)`}
        />
      ))}
      <circle cx="16" cy="16" r="9" fill={ring} />
      <circle cx="16" cy="16" r="7" fill={base} />
    </svg>
  );
}

export function ChipStack({ amount }: { amount: number }) {
  if (amount <= 0) return null;
  return (
    <div className="flex items-center gap-1">
      <Chip amount={amount} size={18} />
      <span className="text-xs font-semibold text-slate-100">{amount}</span>
    </div>
  );
}
