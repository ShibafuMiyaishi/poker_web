import type { Card as CardType } from '@pokergo/shared';

const SUIT_GLYPH: Record<string, string> = { s: '♠', h: '♥', d: '♦', c: '♣' };

interface Props {
  card?: CardType | undefined;
  hidden?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  highlight?: boolean;
}

// PokerStars / GG 風の高コントラスト・大型カード。Suit を 2 色（赤/黒）に明確分け。
// 影とコーナー丸めで物理的な存在感、サイズは flex 環境で gap が効くよう dim 固定。
const SIZE_MAP = {
  xs: { w: 28, h: 40, rankFs: 11, glyphFs: 9, centerFs: 18 },
  sm: { w: 40, h: 56, rankFs: 14, glyphFs: 11, centerFs: 26 },
  md: { w: 64, h: 90, rankFs: 18, glyphFs: 14, centerFs: 38 },
  lg: { w: 84, h: 118, rankFs: 22, glyphFs: 17, centerFs: 50 },
} as const;

export function Card({ card, hidden = false, size = 'md', highlight = false }: Props) {
  const dim = SIZE_MAP[size];
  const shadow = highlight ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'drop-shadow-md';

  if (hidden || !card) {
    return (
      <svg
        viewBox="0 0 56 78"
        width={dim.w}
        height={dim.h}
        className={shadow}
        role="img"
        aria-label="伏せ"
      >
        <defs>
          <linearGradient id="bk-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e40af" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </linearGradient>
        </defs>
        <rect
          x="1"
          y="1"
          width="54"
          height="76"
          rx="6"
          fill="url(#bk-grad)"
          stroke="#3b82f6"
          strokeWidth="1.5"
        />
        <rect
          x="6"
          y="6"
          width="44"
          height="66"
          rx="3"
          fill="none"
          stroke="#60a5fa"
          strokeOpacity="0.6"
          strokeWidth="1"
          strokeDasharray="3 2"
        />
        <text
          x="28"
          y="48"
          textAnchor="middle"
          fontSize="24"
          fontWeight="700"
          fill="#60a5fa"
          opacity="0.55"
        >
          P
        </text>
      </svg>
    );
  }

  const rank = card[0] ?? '?';
  const suit = card[1] ?? '?';
  const display = rank === 'T' ? '10' : rank;
  const isRed = suit === 'h' || suit === 'd';
  const color = isRed ? '#dc2626' : '#0f172a';
  const glyph = SUIT_GLYPH[suit] ?? '?';

  return (
    <svg
      viewBox="0 0 56 78"
      width={dim.w}
      height={dim.h}
      className={shadow}
      role="img"
      aria-label={`${display}${glyph}`}
    >
      <rect
        x="1"
        y="1"
        width="54"
        height="76"
        rx="6"
        fill="#fafafa"
        stroke="#94a3b8"
        strokeWidth="0.5"
      />
      {/* 左上 rank + suit */}
      <text
        x="6"
        y={6 + dim.rankFs}
        fontSize={dim.rankFs}
        fontWeight="800"
        fill={color}
        fontFamily="ui-sans-serif, system-ui"
      >
        {display}
      </text>
      <text x="6" y={6 + dim.rankFs + dim.glyphFs + 2} fontSize={dim.glyphFs} fill={color}>
        {glyph}
      </text>
      {/* 中央 suit (大) */}
      <text x="28" y="50" textAnchor="middle" fontSize={dim.centerFs} fill={color}>
        {glyph}
      </text>
      {/* 右下 rotated */}
      <g transform="rotate(180 28 39)">
        <text x="6" y={6 + dim.rankFs} fontSize={dim.rankFs} fontWeight="800" fill={color}>
          {display}
        </text>
        <text x="6" y={6 + dim.rankFs + dim.glyphFs + 2} fontSize={dim.glyphFs} fill={color}>
          {glyph}
        </text>
      </g>
    </svg>
  );
}
