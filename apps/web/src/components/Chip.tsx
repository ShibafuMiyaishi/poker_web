// チップ: 真鍮 edge + denomination 中央色 + Mono ラベル。
// compact モードは ink-deepest 背景の pill で felt 上でも数字が読める。

interface Props {
  amount: number;
  size?: number;
}

interface ChipPalette {
  base: string;
  ring: string;
  inner: string;
  text: string;
}

function chipColors(amount: number): ChipPalette {
  if (amount >= 1000)
    return { base: '#3b1551', ring: '#c084fc', inner: '#581c87', text: '#fbf7ed' };
  if (amount >= 500) return { base: '#1f1209', ring: '#f5d77a', inner: '#0c1a14', text: '#f5d77a' };
  if (amount >= 100) return { base: '#0d3a25', ring: '#6ee7b7', inner: '#155a3f', text: '#fbf7ed' };
  if (amount >= 25) return { base: '#1e3a8a', ring: '#93c5fd', inner: '#1d4ed8', text: '#fbf7ed' };
  if (amount >= 5) return { base: '#7f1d1d', ring: '#fca5a5', inner: '#b22a2a', text: '#fbf7ed' };
  return { base: '#3b4a3e', ring: '#cbd5e1', inner: '#52615a', text: '#fbf7ed' };
}

function shortLabel(amount: number): string {
  if (amount >= 10_000) return `${Math.floor(amount / 1000)}k`;
  if (amount >= 1000) {
    const k = amount / 1000;
    return Number.isInteger(k) ? `${k}k` : `${k.toFixed(1)}k`;
  }
  return amount.toString();
}

export function Chip({ amount, size = 24 }: Props) {
  const { base, ring, inner, text } = chipColors(amount);
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      role="img"
      aria-label={`chip ${amount}`}
      className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
    >
      <circle cx="16" cy="16" r="15" fill={base} />
      <circle cx="16" cy="16" r="15" fill="none" stroke="#c89f48" strokeWidth="0.6" opacity="0.5" />
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <rect
          key={deg}
          x="14"
          y="1.5"
          width="4"
          height="5"
          rx="0.8"
          fill={ring}
          transform={`rotate(${deg} 16 16)`}
        />
      ))}
      <circle cx="16" cy="16" r="10.5" fill={ring} opacity="0.18" />
      <circle cx="16" cy="16" r="9.5" fill={inner} />
      <circle
        cx="16"
        cy="16"
        r="9.5"
        fill="none"
        stroke="#c89f48"
        strokeWidth="0.5"
        opacity="0.6"
      />
      {size >= 22 && (
        <text
          x="16"
          y="19"
          textAnchor="middle"
          fontSize="7"
          fontWeight="700"
          fill={text}
          fontFamily="JetBrains Mono, ui-monospace, monospace"
          letterSpacing="0.5"
        >
          {shortLabel(amount)}
        </text>
      )}
    </svg>
  );
}

// Physical chip stack — denominations color-mixed, visible offset.
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
  showLabel?: boolean;
}

// 「現ベット額」表示用の compact pill: ink-deepest 背景 + brass border で
// 緑 felt 上でも視認性が極めて高い。
export function ChipStack({ amount, compact = false, showLabel = true }: ChipStackProps) {
  if (amount <= 0) return null;
  if (compact) {
    return (
      <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-ink-deepest/95 border border-brass/40 shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
        <Chip amount={amount} size={14} />
        {showLabel && (
          <span className="text-[11px] font-mono-tabular font-bold text-brass-light tracking-wide tabular-nums">
            {amount.toLocaleString()}
          </span>
        )}
      </div>
    );
  }
  const stack = decomposeChips(amount);
  return (
    <div className="flex flex-col items-center animate-chip-toss">
      <div
        className="relative w-7"
        style={{ height: `${stack.length * 4 + 20}px` }}
        aria-label={`chip stack ${amount}`}
      >
        {stack.map((d, i) => (
          <div
            key={`${i}-${d}`}
            className="absolute left-1/2 -translate-x-1/2"
            style={{ bottom: i * 4 }}
          >
            <Chip amount={d} size={24} />
          </div>
        ))}
      </div>
      {showLabel && (
        <span className="text-[11px] font-mono-tabular font-semibold text-ivory mt-1 tracking-wide tabular-nums">
          {amount.toLocaleString()}
        </span>
      )}
    </div>
  );
}
