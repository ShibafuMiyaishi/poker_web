interface Props {
  label: string;
  en?: string; // 任意
  value: string;
  hint?: string;
  tone?: 'default' | 'positive' | 'negative';
}

// StatCard v3: brass top hairline + 漢字ラベル + 大型数字。en は任意 (削減方針)。
export function StatCard({ label, en, value, hint, tone = 'default' }: Props) {
  const valueClass =
    tone === 'positive' ? 'brass-text' : tone === 'negative' ? 'text-crimson-glow' : 'text-ivory';
  return (
    <div className="relative rounded-md border border-brass/20 bg-gradient-to-b from-ink-deep/95 to-ink/95 p-3 sm:p-4 flex flex-col gap-1 min-w-[120px] shadow-card hover:border-brass/45 hover:bg-ink-deep transition">
      <div className="absolute top-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-brass/30 to-transparent" />
      <div className="flex items-baseline gap-2 mt-1">
        <span className="font-jp text-xs text-ivory-dim tracking-widest">{label}</span>
        {en && (
          <span className="font-display italic text-[10px] text-brass tracking-widest uppercase opacity-70">
            {en}
          </span>
        )}
      </div>
      <div className={`font-display text-2xl sm:text-3xl font-bold tabular-nums ${valueClass}`}>
        {value}
      </div>
      {hint && (
        <div className="text-[10px] text-ivory-muted font-jp tracking-wide truncate">{hint}</div>
      )}
    </div>
  );
}
