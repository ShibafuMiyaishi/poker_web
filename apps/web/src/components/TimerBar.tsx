interface Props {
  remainingMs: number;
  totalMs: number;
}

// アクション残り時間: brass→amber→crimson のグラデでカウントダウン感を強調。
export function TimerBar({ remainingMs, totalMs }: Props) {
  const pct = totalMs > 0 ? Math.max(0, Math.min(1, remainingMs / totalMs)) : 0;
  const seconds = (remainingMs / 1000).toFixed(1);
  const fill =
    pct < 0.3
      ? 'bg-gradient-to-r from-crimson to-crimson-glow'
      : pct < 0.6
        ? 'bg-gradient-to-r from-brass-deep to-brass-light'
        : 'bg-gradient-to-r from-brass to-brass-glow';

  return (
    <div className="w-full">
      <div className="relative h-1.5 rounded-full bg-ink-deep/80 overflow-hidden border border-brass/20">
        <div
          className={`h-full ${fill} transition-[width] duration-100 ease-linear`}
          style={{ width: `${pct * 100}%` }}
        />
      </div>
      <div className="flex justify-end text-[9px] font-mono-tabular text-ivory-dim mt-0.5 tracking-widest">
        {seconds}s
      </div>
    </div>
  );
}
