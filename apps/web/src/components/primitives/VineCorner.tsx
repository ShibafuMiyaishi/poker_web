// 蔦の角飾り。前 iteration の Art Deco 風 Ornament を植物モチーフに刷新。
// 4 隅で対称回転して使う。
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

export function VineCorner({ corner, size = 36, className = '' }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      style={{ transform: ROTATE[corner] }}
      className={`pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`vc-${corner}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f5d77a" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#c89f48" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#6f5520" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      {/* 主蔦 */}
      <path
        d="M 4 4 Q 14 6 18 16 Q 22 26 32 30 Q 42 32 52 32"
        fill="none"
        stroke={`url(#vc-${corner})`}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {/* 副蔦 */}
      <path
        d="M 4 4 Q 10 12 8 22"
        fill="none"
        stroke={`url(#vc-${corner})`}
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.7"
      />
      {/* 葉 1 */}
      <ellipse
        cx="14"
        cy="10"
        rx="2.5"
        ry="5"
        transform="rotate(35 14 10)"
        fill={`url(#vc-${corner})`}
        opacity="0.85"
      />
      {/* 葉 2 */}
      <ellipse
        cx="24"
        cy="22"
        rx="2"
        ry="4.5"
        transform="rotate(-50 24 22)"
        fill={`url(#vc-${corner})`}
        opacity="0.75"
      />
      {/* 葉 3 */}
      <ellipse
        cx="36"
        cy="30"
        rx="2.5"
        ry="5.5"
        transform="rotate(20 36 30)"
        fill={`url(#vc-${corner})`}
        opacity="0.7"
      />
      {/* 巻きひげ */}
      <path
        d="M 6 22 q 2 4 -1 7"
        fill="none"
        stroke={`url(#vc-${corner})`}
        strokeWidth="0.7"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

export function VineFrame({ size = 44, inset = 14 }: { size?: number; inset?: number }) {
  return (
    <>
      <span className="absolute pointer-events-none" style={{ top: inset, left: inset }}>
        <VineCorner corner="tl" size={size} />
      </span>
      <span className="absolute pointer-events-none" style={{ top: inset, right: inset }}>
        <VineCorner corner="tr" size={size} />
      </span>
      <span className="absolute pointer-events-none" style={{ bottom: inset, left: inset }}>
        <VineCorner corner="bl" size={size} />
      </span>
      <span className="absolute pointer-events-none" style={{ bottom: inset, right: inset }}>
        <VineCorner corner="br" size={size} />
      </span>
    </>
  );
}
