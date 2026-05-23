// villain の推定レンジを 13x13 ハンドマトリクスで heatmap 表示する。
// 対角=ペア、上三角=suited、下三角=offsuit。
// weight: 0 → 表示無し / 0.5 → jade/50 / 1.0 → jade。

interface Props {
  range: Record<string, number>;
  highlightHand?: string;
  title?: string;
}

const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

function cellKey(rowIdx: number, colIdx: number): string {
  const r1 = RANKS[rowIdx] ?? '';
  const r2 = RANKS[colIdx] ?? '';
  if (rowIdx === colIdx) return `${r1}${r1}`;
  if (rowIdx < colIdx) return `${r1}${r2}s`;
  return `${r2}${r1}o`;
}

function bgFor(weight: number): string {
  if (weight <= 0) return 'bg-ink-deepest';
  if (weight >= 0.85) return 'bg-jade';
  if (weight >= 0.65) return 'bg-jade/70';
  if (weight >= 0.45) return 'bg-jade/50';
  if (weight >= 0.25) return 'bg-jade/30';
  return 'bg-jade/15';
}

export function RangeHeatmap({ range, highlightHand, title }: Props) {
  return (
    <div className="mt-2 inline-block rounded-md border border-brass/25 bg-ink-deepest/60 p-2">
      {title && (
        <div className="font-jp text-[10px] tracking-widest text-brass-light mb-1">{title}</div>
      )}
      <div
        className="grid gap-px"
        style={{ gridTemplateColumns: 'repeat(13, minmax(0, 1fr))', width: '13rem' }}
      >
        {RANKS.map((_, r) =>
          RANKS.map((__, c) => {
            const key = cellKey(r, c);
            const w = range[key] ?? 0;
            const isHi = key === highlightHand;
            return (
              <div
                key={key}
                title={`${key}: ${(w * 100).toFixed(0)}%`}
                className={`w-4 h-4 ${bgFor(w)} ${isHi ? 'ring-1 ring-brass-glow' : ''}`}
              />
            );
          }),
        )}
      </div>
      <div className="flex items-center gap-1 mt-1 text-[9px] font-mono-tabular text-ivory-muted">
        <span>0%</span>
        <div className="flex-1 h-1 bg-gradient-to-r from-ink-deepest via-jade/50 to-jade rounded-sm" />
        <span>100%</span>
      </div>
    </div>
  );
}
