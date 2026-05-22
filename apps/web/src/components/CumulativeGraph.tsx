import type { GraphPoint } from '../lib/api';

interface Props {
  points: GraphPoint[];
}

const W = 720;
const H = 220;
const PAD_X = 32;
const PAD_Y = 24;

// Ten-Four 風の累積収支グラフ。実損益（緑）のみ。EV 線は EV データを D1 に保存後追加予定。
export function CumulativeGraph({ points }: Props) {
  if (points.length === 0) {
    return (
      <div className="bg-slate-900/40 rounded border border-slate-800 p-6 text-center text-xs text-slate-400">
        まだプレイ履歴がありません。卓画面でハンドを進めると累積収支がここに表示されます。
      </div>
    );
  }
  const bbValues = points.map((p) => p.cumulativeNetBb);
  const maxBb = Math.max(0, ...bbValues);
  const minBb = Math.min(0, ...bbValues);
  const range = Math.max(1, maxBb - minBb);
  const xStep = points.length > 1 ? (W - PAD_X * 2) / (points.length - 1) : 0;
  const yScale = (H - PAD_Y * 2) / range;

  const yFromBb = (bb: number) => H - PAD_Y - (bb - minBb) * yScale;

  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${PAD_X + i * xStep} ${yFromBb(p.cumulativeNetBb)}`)
    .join(' ');

  // 塗りつぶし用に area パス（線の下を薄く着色）
  const areaPath = `${path} L ${PAD_X + (points.length - 1) * xStep} ${yFromBb(0)} L ${PAD_X} ${yFromBb(0)} Z`;

  const finalBb = points[points.length - 1]?.cumulativeNetBb ?? 0;

  return (
    <div className="bg-slate-900/40 rounded border border-slate-800 p-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-56" role="img" aria-label="累積収支グラフ">
        <title>累積収支 (bb 単位)</title>
        {/* 0 ライン */}
        <line
          x1={PAD_X}
          y1={yFromBb(0)}
          x2={W - PAD_X}
          y2={yFromBb(0)}
          stroke="#475569"
          strokeDasharray="3 3"
        />
        {/* 塗りつぶし */}
        <path d={areaPath} fill="#22c55e" fillOpacity={finalBb >= 0 ? 0.12 : 0.05} />
        {/* 実損益ライン */}
        <path d={path} fill="none" stroke="#22c55e" strokeWidth="2" />

        {/* Y 軸ラベル */}
        <text x={4} y={PAD_Y + 10} fontSize="10" fill="#94a3b8">
          {`+${maxBb.toFixed(1)}bb`}
        </text>
        <text x={4} y={H - PAD_Y - 2} fontSize="10" fill="#94a3b8">
          {minBb >= 0 ? '0bb' : `${minBb.toFixed(1)}bb`}
        </text>
        {/* X 軸ラベル */}
        <text x={PAD_X} y={H - 4} fontSize="10" fill="#94a3b8">
          hand 1
        </text>
        <text x={W - PAD_X} y={H - 4} fontSize="10" fill="#94a3b8" textAnchor="end">
          hand {points.length}
        </text>
        {/* 最終値ラベル */}
        <text
          x={W - PAD_X + 4}
          y={yFromBb(finalBb) + 4}
          fontSize="11"
          fontWeight="600"
          fill={finalBb >= 0 ? '#22c55e' : '#ef4444'}
        >
          {finalBb >= 0 ? '+' : ''}
          {finalBb.toFixed(1)}bb
        </text>
      </svg>
    </div>
  );
}
