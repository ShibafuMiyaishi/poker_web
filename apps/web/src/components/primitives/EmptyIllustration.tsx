// 空状態 illustration: 朱印 + 蔦 + テキスト の "designed" empty state。
// History/Stats が API 切断時に黒画面になる問題への対処。
interface Props {
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  variant?: 'cards' | 'chart' | 'general';
}

export function EmptyIllustration({ title, description, action, variant = 'general' }: Props) {
  return (
    <div className="flex flex-col items-center text-center gap-3 py-12 px-4 rounded-md border border-brass/20 bg-gradient-to-b from-ink-deep/60 to-ink/60 paper-noise">
      {/* SVG illustration: 蔦 + 朱印 */}
      <svg
        width="120"
        height="100"
        viewBox="0 0 120 100"
        fill="none"
        aria-hidden="true"
        className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]"
      >
        <defs>
          <linearGradient id="emp-brass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f5d77a" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#6f5520" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        {/* 中央 朱印 (variant 別に文字を変える) */}
        <rect x="46" y="32" width="28" height="36" rx="2" fill="#c14a3d" stroke="#6e1a1f" />
        <text
          x="60"
          y="56"
          textAnchor="middle"
          fontSize="18"
          fontFamily="Shippori Mincho B1, serif"
          fontWeight="800"
          fill="#fbf7ed"
        >
          {variant === 'cards' ? '記' : variant === 'chart' ? '統' : '空'}
        </text>
        {/* 蔦 (左) */}
        <path
          d="M 10 50 Q 24 38 38 50 Q 28 60 16 56"
          stroke="url(#emp-brass)"
          strokeWidth="1.2"
          fill="none"
        />
        <ellipse
          cx="18"
          cy="42"
          rx="3"
          ry="6"
          transform="rotate(45 18 42)"
          fill="url(#emp-brass)"
        />
        {/* 蔦 (右) */}
        <path
          d="M 110 50 Q 96 38 82 50 Q 92 60 104 56"
          stroke="url(#emp-brass)"
          strokeWidth="1.2"
          fill="none"
        />
        <ellipse
          cx="102"
          cy="42"
          rx="3"
          ry="6"
          transform="rotate(-45 102 42)"
          fill="url(#emp-brass)"
        />
      </svg>

      <h3 className="font-jp text-base sm:text-lg text-ivory tracking-widest font-semibold">
        {title}
      </h3>
      {description && (
        <p className="font-jp text-xs sm:text-sm text-ivory-muted max-w-md leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-2 px-5 py-2 rounded-md brass-surface font-jp tracking-widest text-sm text-ivory hover:brightness-110 transition"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
