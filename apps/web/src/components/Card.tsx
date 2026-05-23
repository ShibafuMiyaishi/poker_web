import type { Card as CardType } from '@pokergo/shared';

// Pokergo "Botanical Casino" カード:
//
// 表: 骨色 (#fafafa→#ede2c6) のクリーム地 + Fraunces serif rank + 朱/墨 の suit。
// 裏: **深紺** + brass の交差線 + 中央メダリオン。
//   緑 felt と高コントラストになるよう、前回の深緑系から navy 系へ変更。
//   PokerStars (赤) / GGPoker (紺) を参考に「felt と対比する色」を採用。
//
// 4 サイズ + highlight glow。

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
          {/* 深紺ベース (felt と対比) */}
          <linearGradient id="cb-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a2240" />
            <stop offset="50%" stopColor="#0e1428" />
            <stop offset="100%" stopColor="#050a18" />
          </linearGradient>
          {/* brass 交差線パターン */}
          <pattern id="cb-cross" width="6" height="6" patternUnits="userSpaceOnUse">
            <path d="M 0 6 L 6 0" stroke="#c89f48" strokeWidth="0.4" opacity="0.55" />
            <path d="M 0 0 L 6 6" stroke="#c89f48" strokeWidth="0.4" opacity="0.55" />
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
          stroke="#c89f48"
          strokeWidth="1"
        />
        {/* inner panel: brass crosshatch */}
        <rect x="5" y="5" width="46" height="68" rx="3.5" fill="url(#cb-cross)" />
        <rect
          x="5"
          y="5"
          width="46"
          height="68"
          rx="3.5"
          fill="none"
          stroke="#c89f48"
          strokeOpacity="0.7"
          strokeWidth="0.55"
        />
        {/* 中央メダリオン (brass) */}
        <g transform="translate(28 39)">
          <circle r="9" fill="none" stroke="#f5d77a" strokeWidth="0.7" opacity="0.9" />
          <polygon
            points="0,-7 7,0 0,7 -7,0"
            fill="none"
            stroke="#f5d77a"
            strokeWidth="0.7"
            opacity="0.85"
          />
          <polygon points="0,-4 4,0 0,4 -4,0" fill="#f5d77a" opacity="0.55" />
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
      {/* 微細な紙質感 */}
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
        opacity="0.92"
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
