import type { GraphPoint } from '../lib/api';

interface Props {
  points: GraphPoint[];
}

const W = 720;
const H = 220;
const PAD_X = 32;
const PAD_Y = 24;

// Ten-Four 風二重線グラフ。緑=実損益、黄=EV（実損益 + 累積 deviation_bb）。
// EV 線は D1 actions.deviation_bb が NULL でない場合のみ意味を持つため、
// 分析永続化前のハンドでは EV 線と実損益線が一致する（deviation 累計 = 0）。
export function CumulativeGraph({ points }: Props) {
  if (points.length === 0) {
    return (
      <div className="bg-slate-900/40 rounded border border-slate-800 p-6 text-center text-xs text-slate-400">
        まだプレイ履歴がありません。卓画面でハンドを進めると累積収支がここに表示されます。
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
    <div className="bg-slate-900/40 rounded border border-slate-800 p-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-56" role="img" aria-label="累積収支グラフ">
        <title>累積収支 (bb 単位) ・緑=実損益 黄=EV</title>
        {/* 0 ライン */}
        <line
          x1={PAD_X}
          y1={yFromBb(0)}
          x2={W - PAD_X}
          y2={yFromBb(0)}
          stroke="#475569"
          strokeDasharray="3 3"
        />
        {/* 塗りつぶし（実損益） */}
        <path d={areaPath} fill="#22c55e" fillOpacity={finalNet >= 0 ? 0.12 : 0.05} />
        {/* EV ライン（黄、点線） */}
        {hasMeaningfulEv && (
          <path d={evPath} fill="none" stroke="#eab308" strokeWidth="1.5" strokeDasharray="5 3" />
        )}
        {/* 実損益ライン */}
        <path d={netPath} fill="none" stroke="#22c55e" strokeWidth="2" />

        {/* Y 軸ラベル */}
        <text x={4} y={PAD_Y + 10} fontSize="10" fill="#94a3b8">
          {maxBb >= 0 ? `+${maxBb.toFixed(1)}bb` : `${maxBb.toFixed(1)}bb`}
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
          y={yFromBb(finalNet) + 4}
          fontSize="11"
          fontWeight="600"
          fill={finalNet >= 0 ? '#22c55e' : '#ef4444'}
        >
          {finalNet >= 0 ? '+' : ''}
          {finalNet.toFixed(1)}bb
        </text>
        {hasMeaningfulEv && (
          <text x={W - PAD_X + 4} y={yFromBb(finalEv) + 4} fontSize="10" fill="#eab308">
            EV {finalEv >= 0 ? '+' : ''}
            {finalEv.toFixed(1)}bb
          </text>
        )}
      </svg>
      <div className="px-2 py-1 text-[10px] text-slate-400 flex items-center gap-3">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-0.5 bg-win" /> 実損益
        </span>
        <span className="flex items-center gap-1">
          <span
            className="inline-block w-3 h-0.5"
            style={{
              background: 'repeating-linear-gradient(90deg, #eab308 0 4px, transparent 4px 7px)',
            }}
          />
          EV (実損益 + 累積 deviation_bb)
        </span>
      </div>
    </div>
  );
}
