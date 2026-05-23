import type { GraphPoint } from '../lib/api';

interface Props {
  points: GraphPoint[];
}

const W = 720;
const H = 240;
const PAD_X = 36;
const PAD_Y = 28;

// 累積収支グラフ (Ten-Four 風の二重線):
//   緑線 = 実損益、黄点線 = EV (実損益 + 累積 deviation_bb)
//   背景に微細グリッド、上下に brass の細線、最終値ラベル。
export function CumulativeGraph({ points }: Props) {
  if (points.length === 0) {
    return (
      <div className="relative rounded-md border border-brass/20 bg-gradient-to-b from-ink-deep/95 to-ink/95 p-8 text-center shadow-card">
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-brass/30 to-transparent" />
        <p className="font-display italic text-sm text-ivory-dim">
          まだプレイ履歴がありません。卓に戻ってハンドを進めると累積収支がここに表示されます。
        </p>
      </div>
    );
  }

  const netValues = points.map((p) => p.cumulativeNetBb);
  const evValues = points.map((p) => p.cumulativeEvBb);
  const maxBb = Math.max(0, ...netValues, ...evValues);
  const minBb = Math.min(0, ...netValues, ...evValues);
  const range = Math.max(1, maxBb - minBb);
  const xStep = points.length > 1 ? (W - PAD_X * 2) / (points.length - 1) : 0;
  const yScale = (H - PAD_Y * 2) / range;
  const yFromBb = (bb: number) => H - PAD_Y - (bb - minBb) * yScale;

  const netPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${PAD_X + i * xStep} ${yFromBb(p.cumulativeNetBb)}`)
    .join(' ');
  const evPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${PAD_X + i * xStep} ${yFromBb(p.cumulativeEvBb)}`)
    .join(' ');
  const areaPath = `${netPath} L ${PAD_X + (points.length - 1) * xStep} ${yFromBb(0)} L ${PAD_X} ${yFromBb(0)} Z`;

  const finalNet = points[points.length - 1]?.cumulativeNetBb ?? 0;
  const finalEv = points[points.length - 1]?.cumulativeEvBb ?? 0;
  const hasMeaningfulEv = Math.abs(finalEv - finalNet) > 0.01;

  return (
    <div className="relative rounded-md border border-brass/20 bg-gradient-to-b from-ink-deep/95 to-ink/95 p-3 shadow-card">
      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-brass/30 to-transparent" />
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-56" role="img" aria-label="累積収支グラフ">
        <title>累積収支 (bb) ・緑=実損益 黄=EV</title>
        <defs>
          <linearGradient id="net-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4a9d7a" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#4a9d7a" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="net-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6ee7b7" />
            <stop offset="100%" stopColor="#4a9d7a" />
          </linearGradient>
        </defs>
        {/* horizontal grid lines */}
        {[0.25, 0.5, 0.75].map((t) => (
          <line
            key={t}
            x1={PAD_X}
            y1={PAD_Y + (H - PAD_Y * 2) * t}
            x2={W - PAD_X}
            y2={PAD_Y + (H - PAD_Y * 2) * t}
            stroke="#3a4a40"
            strokeWidth="0.5"
            strokeDasharray="2 4"
          />
        ))}
        {/* 0 line */}
        <line
          x1={PAD_X}
          y1={yFromBb(0)}
          x2={W - PAD_X}
          y2={yFromBb(0)}
          stroke="#c89f48"
          strokeWidth="0.8"
          strokeDasharray="3 3"
          opacity="0.6"
        />
        {/* fill (net) */}
        <path d={areaPath} fill="url(#net-area)" />
        {/* EV line */}
        {hasMeaningfulEv && (
          <path
            d={evPath}
            fill="none"
            stroke="#f5d77a"
            strokeWidth="1.6"
            strokeDasharray="6 3"
            opacity="0.9"
          />
        )}
        {/* net line */}
        <path d={netPath} fill="none" stroke="url(#net-line)" strokeWidth="2.2" />

        {/* y labels */}
        <text
          x={4}
          y={PAD_Y + 12}
          fontSize="11"
          fontFamily="JetBrains Mono, monospace"
          fill="#9c9379"
        >
          {`${maxBb >= 0 ? '+' : ''}${maxBb.toFixed(1)}bb`}
        </text>
        <text
          x={4}
          y={H - PAD_Y - 2}
          fontSize="11"
          fontFamily="JetBrains Mono, monospace"
          fill="#9c9379"
        >
          {minBb >= 0 ? '0bb' : `${minBb.toFixed(1)}bb`}
        </text>
        {/* x labels */}
        <text
          x={PAD_X}
          y={H - 6}
          fontSize="10"
          fontFamily="Fraunces, serif"
          fontStyle="italic"
          fill="#9c9379"
        >
          hand 1
        </text>
        <text
          x={W - PAD_X}
          y={H - 6}
          fontSize="10"
          fontFamily="Fraunces, serif"
          fontStyle="italic"
          fill="#9c9379"
          textAnchor="end"
        >
          hand {points.length}
        </text>
        {/* final values */}
        <text
          x={W - PAD_X - 4}
          y={yFromBb(finalNet) - 6}
          fontSize="12"
          fontWeight="700"
          textAnchor="end"
          fontFamily="JetBrains Mono, monospace"
          fill={finalNet >= 0 ? '#6ee7b7' : '#ef4444'}
        >
          {finalNet >= 0 ? '+' : ''}
          {finalNet.toFixed(1)}bb
        </text>
        {hasMeaningfulEv && (
          <text
            x={W - PAD_X - 4}
            y={yFromBb(finalEv) - 6}
            fontSize="10"
            textAnchor="end"
            fontFamily="JetBrains Mono, monospace"
            fill="#f5d77a"
          >
            EV {finalEv >= 0 ? '+' : ''}
            {finalEv.toFixed(1)}
          </text>
        )}
      </svg>
      <div className="flex items-center gap-4 px-3 pb-1 text-[10px] text-ivory-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-0.5 bg-gradient-to-r from-jade-glow to-jade" />
          <span className="font-jp">実損益</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-4 h-0.5"
            style={{
              background: 'repeating-linear-gradient(90deg, #f5d77a 0 5px, transparent 5px 8px)',
            }}
          />
          <span className="font-jp">EV ライン (採用 vs 最善 EV 差の累積)</span>
        </span>
      </div>
    </div>
  );
}
