// Art Deco 風の角飾り SVG。Brass rim と組み合わせて卓やパネルの 4 隅に差す。
interface Props {
  corner: 'tl' | 'tr' | 'bl' | 'br';
  size?: number;
  className?: string;
}

const ROTATE: Record<Props['corner'], string> = {
  tl: 'rotate(0deg)',
  tr: 'rotate(90deg)',
  br: 'rotate(180deg)',
  bl: 'rotate(270deg)',
};

export function Ornament({ corner, size = 28, className = '' }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      style={{ transform: ROTATE[corner] }}
      className={`pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`orn-${corner}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f5d77a" />
          <stop offset="50%" stopColor="#c89f48" />
          <stop offset="100%" stopColor="#6f5520" />
        </linearGradient>
      </defs>
      <path
        d="M 2 14 L 2 2 L 14 2"
        fill="none"
        stroke={`url(#orn-${corner})`}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M 6 14 L 6 6 L 14 6"
        fill="none"
        stroke={`url(#orn-${corner})`}
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.7"
      />
      <circle cx="2" cy="2" r="1.4" fill="url(#orn-${corner})" />
    </svg>
  );
}

// 4 隅セット
export function OrnamentFrame({ size = 24, inset = 6 }: { size?: number; inset?: number }) {
  return (
    <>
      <span className="absolute" style={{ top: inset, left: inset }}>
        <Ornament corner="tl" size={size} />
      </span>
      <span className="absolute" style={{ top: inset, right: inset }}>
        <Ornament corner="tr" size={size} />
      </span>
      <span className="absolute" style={{ bottom: inset, left: inset }}>
        <Ornament corner="bl" size={size} />
      </span>
      <span className="absolute" style={{ bottom: inset, right: inset }}>
        <Ornament corner="br" size={size} />
      </span>
    </>
  );
}
