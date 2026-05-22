interface Props {
  remainingMs: number;
  totalMs: number;
}

// アクション残り時間のプログレスバー。0 になると枯れた色に。
export function TimerBar({ remainingMs, totalMs }: Props) {
  const pct = Math.max(0, Math.min(1, remainingMs / totalMs));
  const color = pct < 0.3 ? 'bg-lose' : pct < 0.6 ? 'bg-yellow-500' : 'bg-accent';
  return (
    <div className="absolute -bottom-1 left-1 right-1 h-1 rounded bg-slate-800 overflow-hidden">
      <div
        className={`h-full transition-[width] duration-100 ease-linear ${color}`}
        style={{ width: `${pct * 100}%` }}
      />
    </div>
  );
}
