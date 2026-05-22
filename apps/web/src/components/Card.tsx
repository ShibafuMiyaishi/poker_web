import type { Card as CardType } from '@pokergo/shared';

const SUIT_GLYPH: Record<string, string> = { s: '♠', h: '♥', d: '♦', c: '♣' };

interface Props {
  card?: CardType | undefined;
  hidden?: boolean;
  size?: 'sm' | 'md';
}

// プログラマティック SVG トランプ。Ten-Four 風ミニマル設計。
export function Card({ card, hidden = false, size = 'md' }: Props) {
  const dim = size === 'sm' ? { w: 36, h: 50 } : { w: 56, h: 78 };

  if (hidden || !card) {
    return (
      <svg
        viewBox="0 0 56 78"
        width={dim.w}
        height={dim.h}
        className="drop-shadow"
        role="img"
        aria-label="伏せられたカード"
      >
        <rect
          x="1"
          y="1"
          width="54"
          height="76"
          rx="6"
          fill="#1e3a8a"
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
          strokeOpacity="0.7"
          strokeWidth="1"
          strokeDasharray="3 2"
        />
        <text
          x="28"
          y="46"
          textAnchor="middle"
          fontSize="22"
          fontWeight="700"
          fill="#60a5fa"
          opacity="0.6"
          fontFamily="ui-sans-serif, system-ui"
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
      className="drop-shadow"
      role="img"
      aria-label={`${display}${glyph}`}
    >
      <rect
        x="1"
        y="1"
        width="54"
        height="76"
        rx="6"
        fill="#f8fafc"
        stroke="#cbd5e1"
        strokeWidth="1"
      />
      {/* 左上 rank + suit */}
      <text
        x="6"
        y="18"
        fontSize="13"
        fontWeight="700"
        fill={color}
        fontFamily="ui-sans-serif, system-ui"
      >
        {display}
      </text>
      <text x="6" y="30" fontSize="11" fill={color} fontFamily="ui-sans-serif, system-ui">
        {glyph}
      </text>
      {/* 中央大きな suit */}
      <text
        x="28"
        y="52"
        textAnchor="middle"
        fontSize="30"
        fill={color}
        fontFamily="ui-sans-serif, system-ui"
      >
        {glyph}
      </text>
      {/* 右下 rotated rank + suit */}
      <g transform="rotate(180 28 39)">
        <text
          x="6"
          y="18"
          fontSize="13"
          fontWeight="700"
          fill={color}
          fontFamily="ui-sans-serif, system-ui"
        >
          {display}
        </text>
        <text x="6" y="30" fontSize="11" fill={color} fontFamily="ui-sans-serif, system-ui">
          {glyph}
        </text>
      </g>
    </svg>
  );
}
