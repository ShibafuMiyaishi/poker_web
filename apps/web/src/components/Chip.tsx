interface Props {
  amount: number;
  size?: number;
}

// チップ色: 額面で 5 段階に色分け（PokerStars 風 + ハイライト強化）。
function chipColors(amount: number): { base: string; ring: string; inner: string } {
  if (amount >= 1000) return { base: '#581c87', ring: '#c084fc', inner: '#7e22ce' }; // 紫/ハイ
  if (amount >= 500) return { base: '#0f172a', ring: '#fbbf24', inner: '#1e293b' }; // 黒/金
  if (amount >= 100) return { base: '#15803d', ring: '#86efac', inner: '#16a34a' }; // 緑
  if (amount >= 25) return { base: '#1d4ed8', ring: '#93c5fd', inner: '#2563eb' }; // 青
  if (amount >= 5) return { base: '#b91c1c', ring: '#fca5a5', inner: '#dc2626' }; // 赤
  return { base: '#475569', ring: '#cbd5e1', inner: '#64748b' }; // 灰 (小額)
}

export function Chip({ amount, size = 22 }: Props) {
  const { base, ring, inner } = chipColors(amount);
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
      <circle cx="16" cy="16" r="7" fill={inner} />
    </svg>
  );
}

// チップの「物理的」な積み上げ表現。額面に応じて色違いを縦に重ねる。
function decomposeChips(amount: number): number[] {
  if (amount <= 0) return [];
  const denoms = [1000, 500, 100, 25, 5, 1];
  const out: number[] = [];
  let remaining = amount;
  for (const d of denoms) {
    while (remaining >= d && out.length < 6) {
      out.push(d);
      remaining -= d;
    }
    if (out.length >= 6) break;
  }
  return out;
}

interface ChipStackProps {
  amount: number;
  compact?: boolean;
}

// 額面 → 積みチップ画像（最大 6 段）+ 合計テキスト
export function ChipStack({ amount, compact = false }: ChipStackProps) {
  if (amount <= 0) return null;
  const stack = decomposeChips(amount);
  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <Chip amount={amount} size={16} />
        <span className="text-[11px] font-semibold tabular-nums text-slate-100">{amount}</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-7 h-8" aria-label={`chip stack ${amount}`}>
        {stack.map((d, i) => (
          <div
            key={`${i}-${d}`}
            className="absolute left-1/2 -translate-x-1/2"
            style={{ bottom: i * 2 }}
          >
            <Chip amount={d} size={22} />
          </div>
        ))}
      </div>
      <span className="text-[11px] font-semibold tabular-nums text-slate-100 mt-0.5">{amount}</span>
    </div>
  );
}
