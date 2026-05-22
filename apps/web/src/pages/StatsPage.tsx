import { useEffect, useState } from 'react';
import { CumulativeGraph } from '../components/CumulativeGraph';
import { StatCard } from '../components/StatCard';
import { type GraphPoint, type Period, type StatsSummary, getGraph, getStats } from '../lib/api';

const PERIOD_LABELS: { key: Period; label: string }[] = [
  { key: 'all', label: '全期間' },
  { key: 'month', label: '直近30日' },
  { key: 'week', label: '直近7日' },
];

function fmtPct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

function fmtAf(v: number): string {
  if (!Number.isFinite(v)) return '∞';
  return v.toFixed(2);
}

export function StatsPage() {
  const [period, setPeriod] = useState<Period>('all');
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [points, setPoints] = useState<GraphPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([getStats(period), getGraph(period)])
      .then(([s, g]) => {
        setStats(s);
        setPoints(g.points);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400">期間:</span>
        {PERIOD_LABELS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setPeriod(p.key)}
            className={`text-xs px-3 py-1 rounded ${
              period === p.key ? 'bg-accent' : 'bg-slate-800 hover:bg-slate-700'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading && <div className="text-sm text-slate-400">読み込み中…</div>}
      {error && (
        <div className="text-sm text-lose">
          エラー: {error}（wrangler dev が起動しているか確認）
        </div>
      )}

      {stats && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <StatCard
              label="ハンド数"
              value={stats.handsPlayed.toLocaleString()}
              hint={`net ${stats.totalNetChips > 0 ? '+' : ''}${stats.totalNetChips} chips`}
            />
            <StatCard
              label="bb/100"
              value={`${stats.bbPer100 >= 0 ? '+' : ''}${stats.bbPer100.toFixed(2)}`}
              tone={stats.bbPer100 >= 0 ? 'positive' : 'negative'}
              hint="100ハンドあたり実損益"
            />
            <StatCard
              label="EV bb/100"
              value={`${stats.evBbPer100 >= 0 ? '+' : ''}${stats.evBbPer100.toFixed(2)}`}
              tone={stats.evBbPer100 >= 0 ? 'positive' : 'negative'}
              hint={`累積 dev ${stats.totalDeviationBb >= 0 ? '+' : ''}${stats.totalDeviationBb.toFixed(1)}bb`}
            />
            <StatCard label="VPIP" value={fmtPct(stats.vpip)} hint="自発参加率" />
            <StatCard label="PFR" value={fmtPct(stats.pfr)} hint="プリフロップレイズ率" />
            <StatCard label="3-bet%" value={fmtPct(stats.threeBetPct)} hint="3-bet 機会比" />
            <StatCard
              label="AF"
              value={fmtAf(stats.af)}
              hint={`(bet+raise)/call = ${stats.detail.postflopAggressive}/${stats.detail.postflopCalls}`}
            />
            <StatCard label="WTSD" value={fmtPct(stats.wtsd)} hint="ショウダウン到達率" />
            <StatCard label="W$SD" value={fmtPct(stats.wDollarSd)} hint="ショウダウン勝率" />
          </div>

          <div>
            <h2 className="text-sm font-semibold mb-1">累積収支（実損益 緑 / EV 黄点線）</h2>
            <p className="text-[11px] text-slate-500 mb-2">
              EV 線 = 実損益 + 累積 deviation_bb（最善 EV と採用 EV の差の累計）。差分が大きいほど
              「最善プレイから乖離したぶん」を表す。差が無いハンドでは線が重なる。
            </p>
            <CumulativeGraph points={points} />
          </div>
        </>
      )}
    </div>
  );
}
