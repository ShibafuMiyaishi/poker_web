import type { Card as CardType } from '@pokergo/shared';

// 「上質ラウンジ」のカード:
// - 表: 骨色 (#f4ecd8) のクリーム地 + serif 風 rank + suit color (赤/黒)
// - 裏: 深緑 felt + brass の交差ライン文様 (PokerStars / GG の重厚感)
// - highlight prop で手番の glow を加える

const SUIT_GLYPH: Record<string, string> = { s: '♠', h: '♥', d: '♦', c: '♣' };

interface Props {
  card?: CardType | undefined;
  hidden?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  highlight?: boolean;
}

const SIZE_MAP = {
  xs: { w: 28, h: 40, rankFs: 11, glyphFs: 9, centerFs: 18 },
  sm: { w: 42, h: 60, rankFs: 15, glyphFs: 11, centerFs: 26 },
  md: { w: 68, h: 96, rankFs: 20, glyphFs: 14, centerFs: 42 },
  lg: { w: 92, h: 130, rankFs: 26, glyphFs: 18, centerFs: 56 },
} as const;

export function Card({ card, hidden = false, size = 'md', highlight = false }: Props) {
  const dim = SIZE_MAP[size];
  const glow = highlight
    ? 'drop-shadow-[0_0_10px_rgba(245,215,122,0.7)]'
    : 'drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)]';

  if (hidden || !card) {
    return (
      <svg
        viewBox="0 0 56 78"
        width={dim.w}
        height={dim.h}
        className={glow}
        role="img"
        aria-label="伏せ"
      >
        <defs>
          <linearGradient id="cb-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1d8158" />
            <stop offset="55%" stopColor="#155a3f" />
            <stop offset="100%" stopColor="#0a2f22" />
          </linearGradient>
          <linearGradient id="cb-edge" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f5d77a" />
            <stop offset="100%" stopColor="#6f5520" />
          </linearGradient>
          <pattern id="cb-pat" width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M 0 8 L 8 0" stroke="#c89f48" strokeWidth="0.5" opacity="0.35" />
            <path d="M 0 0 L 8 8" stroke="#c89f48" strokeWidth="0.5" opacity="0.35" />
          </pattern>
        </defs>
        {/* base */}
        <rect
          x="1"
          y="1"
          width="54"
          height="76"
          rx="6"
          fill="url(#cb-bg)"
          stroke="url(#cb-edge)"
          strokeWidth="1.5"
        />
        {/* inner panel */}
        <rect x="6" y="6" width="44" height="66" rx="3" fill="url(#cb-pat)" />
        <rect
          x="6"
          y="6"
          width="44"
          height="66"
          rx="3"
          fill="none"
          stroke="#f5d77a"
          strokeOpacity="0.55"
          strokeWidth="0.6"
        />
        {/* center diamond/seal */}
        <g transform="translate(28 39)">
          <polygon
            points="0,-9 9,0 0,9 -9,0"
            fill="none"
            stroke="#f5d77a"
            strokeWidth="0.8"
            opacity="0.7"
          />
          <polygon
            points="0,-5 5,0 0,5 -5,0"
            fill="none"
            stroke="#f5d77a"
            strokeWidth="0.5"
            opacity="0.55"
          />
          <text
            x="0"
            y="2"
            textAnchor="middle"
            fontSize="9"
            fontWeight="700"
            fontFamily="Fraunces, serif"
            fill="#f5d77a"
            opacity="0.85"
          >
            P
          </text>
        </g>
      </svg>
    );
  }

  const rank = card[0] ?? '?';
  const suit = card[1] ?? '?';
  const display = rank === 'T' ? '10' : rank;
  const isRed = suit === 'h' || suit === 'd';
  const color = isRed ? '#b22a2a' : '#0c1a14';
  const glyph = SUIT_GLYPH[suit] ?? '?';

  return (
    <svg
      viewBox="0 0 56 78"
      width={dim.w}
      height={dim.h}
      className={glow}
      role="img"
      aria-label={`${display}${glyph}`}
    >
      <defs>
        <linearGradient id={`cf-${suit}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbf7ed" />
          <stop offset="100%" stopColor="#ede2c6" />
        </linearGradient>
      </defs>
      <rect
        x="1"
        y="1"
        width="54"
        height="76"
        rx="6"
        fill={`url(#cf-${suit})`}
        stroke="#a8997a"
        strokeWidth="0.6"
      />
      {/* 微細な paper grain 模倣: うすく noise を重ねる */}
      <rect x="1" y="1" width="54" height="76" rx="6" fill="#000" opacity="0.04" />
      {/* 左上 rank + suit (serif) */}
      <text
        x="5.5"
        y={6 + dim.rankFs}
        fontSize={dim.rankFs}
        fontWeight="700"
        fill={color}
        fontFamily="Fraunces, ui-serif, serif"
      >
        {display}
      </text>
      <text
        x="5.5"
        y={6 + dim.rankFs + dim.glyphFs + 2}
        fontSize={dim.glyphFs}
        fill={color}
        fontFamily="ui-sans-serif"
      >
        {glyph}
      </text>
      {/* 中央 suit */}
      <text
        x="28"
        y="50"
        textAnchor="middle"
        fontSize={dim.centerFs}
        fill={color}
        fontFamily="ui-sans-serif"
        opacity="0.9"
      >
        {glyph}
      </text>
      {/* 右下 rotated */}
      <g transform="rotate(180 28 39)">
        <text
          x="5.5"
          y={6 + dim.rankFs}
          fontSize={dim.rankFs}
          fontWeight="700"
          fill={color}
          fontFamily="Fraunces, serif"
        >
          {display}
        </text>
        <text x="5.5" y={6 + dim.rankFs + dim.glyphFs + 2} fontSize={dim.glyphFs} fill={color}>
          {glyph}
        </text>
      </g>
    </svg>
  );
}
