// 軽量 skeleton placeholder。読み込み中の灰色四角を brass で微かに pulse させる。
// prefers-reduced-motion / data-reduce-motion を尊重 (animate-pulse 自動停止)

interface Props {
  className?: string;
  /** 横長/正方形/タイル等のプリセット */
  variant?: 'text' | 'card' | 'avatar' | 'block';
}

export function Skeleton({ className = '', variant = 'block' }: Props) {
  const v: Record<NonNullable<Props['variant']>, string> = {
    text: 'h-3 rounded',
    card: 'h-24 rounded-md',
    avatar: 'w-10 h-10 rounded-full',
    block: 'rounded-md',
  };
  return (
    <div
      className={`bg-gradient-to-r from-ink-soft via-ink-line to-ink-soft animate-pulse ${v[variant]} ${className}`}
      aria-busy="true"
      aria-live="polite"
    />
  );
}

// ハンド一覧用 row skeleton (記録ページ)
export function HandRowSkeleton() {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 border-b border-ink-line/30">
      <Skeleton variant="text" className="w-12" />
      <Skeleton variant="text" className="flex-1" />
      <Skeleton variant="text" className="w-16" />
    </div>
  );
}

// 統計カード用 skeleton
export function StatCardSkeleton() {
  return (
    <div className="rounded-md border border-brass/15 bg-ink-deep/60 p-3 flex flex-col gap-2">
      <Skeleton variant="text" className="w-16 h-2" />
      <Skeleton variant="text" className="w-24 h-6" />
      <Skeleton variant="text" className="w-12 h-2" />
    </div>
  );
}
