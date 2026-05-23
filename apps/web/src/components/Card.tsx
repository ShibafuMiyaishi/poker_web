import type { Card as CardType } from '@pokergo/shared';

// Pokergo "Botanical Vault" Card v3:
//
// 表: 骨色クリーム + Fraunces serif rank (SVG 内 fallback 対策で text-anchor 調整)。
//     suit の中央表示は size 別に丁寧にセンタリング。
//     "10" は 2 桁なので少し小さく + 詰め組。
// 裏: **深紺 + brass の蔦パターン + 中央朱印** (botanical vault のシグネチャ)。
//     PokerStars の標準パターンから決別、独自の identity を持つ。

const SUIT_GLYPH: Record<string, string> = { s: '♠', h: '♥', d: '♦', c: '♣' };
const SUIT_NAME_JP: Record<string, string> = {
  s: 'スペード',
  h: 'ハート',
  d: 'ダイヤ',
  c: 'クラブ',
};
const RANK_NAME_JP: Record<string, string> = {
  A: 'エース',
  K: 'キング',
  Q: 'クイーン',
  J: 'ジャック',
  T: '10',
};

interface Props {
  card?: CardType | undefined;
  hidden?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  highlight?: boolean;
}

const SIZE_MAP = {
  xs: { w: 28, h: 40, rankFs: 11, glyphFs: 9, centerFs: 18 },
  sm: { w: 42, h: 60, rankFs: 14, glyphFs: 10, centerFs: 24 },
  md: { w: 68, h: 96, rankFs: 20, glyphFs: 14, centerFs: 40 },
  lg: { w: 92, h: 130, rankFs: 26, glyphFs: 18, centerFs: 54 },
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
        aria-label="伏せられたカード"
      >
        <defs>
          <linearGradient id="cb-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a2240" />
            <stop offset="55%" stopColor="#0e1428" />
            <stop offset="100%" stopColor="#050a18" />
          </linearGradient>
          {/* 蔦パターン (botanical signature) */}
          <pattern id="cb-vine" width="14" height="20" patternUnits="userSpaceOnUse">
            <path
              d="M 7 0 Q 11 5 7 10 Q 3 15 7 20"
              stroke="#c89f48"
              strokeWidth="0.4"
              fill="none"
              opacity="0.6"
            />
            <ellipse
              cx="10"
              cy="5"
              rx="1.2"
              ry="2.4"
              transform="rotate(35 10 5)"
              fill="#c89f48"
              opacity="0.55"
            />
            <ellipse
              cx="4"
              cy="15"
              rx="1.2"
              ry="2.4"
              transform="rotate(-35 4 15)"
              fill="#c89f48"
              opacity="0.55"
            />
          </pattern>
        </defs>
        {/* base 紺地 */}
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
        {/* 蔦パターンを内側に */}
        <rect x="5" y="5" width="46" height="68" rx="3.5" fill="url(#cb-vine)" />
        <rect
          x="5"
          y="5"
          width="46"
          height="68"
          rx="3.5"
          fill="none"
          stroke="#c89f48"
          strokeOpacity="0.7"
          strokeWidth="0.6"
        />
        {/* 中央 朱印 (識別) */}
        <g transform="translate(28 39)">
          <rect
            x="-8"
            y="-9"
            width="16"
            height="18"
            rx="1.5"
            fill="#c14a3d"
            stroke="#6e1a1f"
            strokeWidth="0.5"
            opacity="0.9"
          />
          <text
            x="0"
            y="3"
            textAnchor="middle"
            fontSize="9"
            fontWeight="800"
            fontFamily="Shippori Mincho B1, serif"
            fill="#fbf7ed"
          >
            囲
          </text>
        </g>
      </svg>
    );
  }

  const rank = card[0] ?? '?';
  const suit = card[1] ?? '?';
  const display = rank === 'T' ? '10' : rank;
  const isTen = rank === 'T';
  const isRed = suit === 'h' || suit === 'd';
  const color = isRed ? '#b22a2a' : '#0c1a14';
  const glyph = SUIT_GLYPH[suit] ?? '?';

  // a11y: スクリーンリーダ用に「ハートの 5」のような自然表記
  const ariaLabel = `${SUIT_NAME_JP[suit] ?? suit}の${RANK_NAME_JP[rank] ?? display}`;

  // "10" は幅が広いので少し縮める
  const cornerRankFs = isTen ? dim.rankFs * 0.78 : dim.rankFs;

  return (
    <svg
      viewBox="0 0 56 78"
      width={dim.w}
      height={dim.h}
      className={glow}
      role="img"
      aria-label={ariaLabel}
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
      {/* 紙質感 */}
      <rect x="1" y="1" width="54" height="76" rx="6" fill="#000" opacity="0.035" />

      {/* 左上 rank + suit (serif fallback だが SVG 内では Fraunces はロードされないため、ui-serif で十分セリフ感) */}
      <text
        x="5.5"
        y={6 + cornerRankFs}
        fontSize={cornerRankFs}
        fontWeight="700"
        fill={color}
        fontFamily="Georgia, ui-serif, serif"
      >
        {display}
      </text>
      <text
        x={isTen ? 8 : 5.5}
        y={6 + cornerRankFs + dim.glyphFs + 1}
        fontSize={dim.glyphFs}
        fill={color}
        fontFamily="ui-sans-serif"
      >
        {glyph}
      </text>

      {/* 中央 suit (大) */}
      <text
        x="28"
        y={52 + dim.centerFs * 0.05}
        textAnchor="middle"
        fontSize={dim.centerFs}
        fill={color}
        fontFamily="ui-sans-serif"
        opacity="0.92"
      >
        {glyph}
      </text>

      {/* 右下 rotated rank + suit */}
      <g transform="rotate(180 28 39)">
        <text
          x="5.5"
          y={6 + cornerRankFs}
          fontSize={cornerRankFs}
          fontWeight="700"
          fill={color}
          fontFamily="Georgia, ui-serif, serif"
        >
          {display}
        </text>
        <text
          x={isTen ? 8 : 5.5}
          y={6 + cornerRankFs + dim.glyphFs + 1}
          fontSize={dim.glyphFs}
          fill={color}
        >
          {glyph}
        </text>
      </g>
    </svg>
  );
}
