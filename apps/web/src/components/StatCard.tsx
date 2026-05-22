interface Props {
  label: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'positive' | 'negative';
}

export function StatCard({ label, value, hint, tone = 'default' }: Props) {
  const valueClass =
    tone === 'positive' ? 'text-win' : tone === 'negative' ? 'text-lose' : 'text-slate-100';
  return (
    <div className="bg-slate-900/60 rounded p-3 border border-slate-800 flex flex-col gap-1 min-w-[120px]">
      <div className="text-[11px] text-slate-400 uppercase tracking-wide">{label}</div>
      <div className={`text-xl font-semibold tabular-nums ${valueClass}`}>{value}</div>
      {hint && <div className="text-[10px] text-slate-500">{hint}</div>}
    </div>
  );
}
