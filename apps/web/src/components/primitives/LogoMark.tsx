// Pokergo の Logo Mark: 楕円卓 + 葉脈 + 朱印「囲」を組み合わせた識別マーク。
// 「P + 蔦 + カジノ卓」を象徴。
interface Props {
  size?: number;
  className?: string;
}

export function LogoMark({ size = 36, className = '' }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label="Pokergo logo"
      className={className}
    >
      <defs>
        <linearGradient id="lm-brass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="60%" stopColor="#c89f48" />
          <stop offset="100%" stopColor="#6f5520" />
        </linearGradient>
      </defs>
      {/* 楕円卓を表す外形 */}
      <ellipse
        cx="24"
        cy="24"
        rx="20"
        ry="14"
        fill="none"
        stroke="url(#lm-brass)"
        strokeWidth="1.6"
      />
      {/* 蔦 (botanical) — 楕円の上下に這うように */}
      <path
        d="M 6 18 Q 12 14 18 18 Q 24 22 30 18 Q 36 14 42 18"
        stroke="url(#lm-brass)"
        strokeWidth="1"
        fill="none"
        opacity="0.7"
      />
      <ellipse
        cx="13"
        cy="15.5"
        rx="1.4"
        ry="2.6"
        transform="rotate(40 13 15.5)"
        fill="url(#lm-brass)"
        opacity="0.75"
      />
      <ellipse
        cx="35"
        cy="15.5"
        rx="1.4"
        ry="2.6"
        transform="rotate(-40 35 15.5)"
        fill="url(#lm-brass)"
        opacity="0.75"
      />
      {/* 中央: 朱印「囲」 */}
      <rect
        x="17"
        y="20"
        width="14"
        height="14"
        rx="1.2"
        fill="#c14a3d"
        stroke="#6e1a1f"
        strokeWidth="0.6"
      />
      <text
        x="24"
        y="30.5"
        textAnchor="middle"
        fontSize="9"
        fontWeight="800"
        fontFamily="Shippori Mincho B1, serif"
        fill="#fbf7ed"
      >
        囲
      </text>
    </svg>
  );
}
