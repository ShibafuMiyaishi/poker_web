import { useEffect, useRef } from 'react';

interface Props {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 破壊的操作なら true (赤 button) */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// 破壊的アクション (ログアウト/データ削除等) の前に確認するモーダル。
// Esc で cancel、Enter で confirm。focus trap 簡易実装。
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = '実行',
  cancelLabel = 'キャンセル',
  destructive = false,
  onConfirm,
  onCancel,
}: Props) {
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    confirmBtnRef.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onCancel, onConfirm]);

  if (!open) return null;

  return (
    <div
      // biome-ignore lint/a11y/useSemanticElements: <dialog> はブラウザ default styling 衝突のため div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-abyss/85 backdrop-blur-sm animate-rise"
    >
      <div className="relative w-full max-w-sm rounded-lg border border-brass/45 bg-gradient-to-b from-ink-deep to-ink-abyss shadow-card p-5 paper-noise animate-stamp">
        <div className="absolute top-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-brass to-transparent" />
        <h2
          id="confirm-title"
          className="font-jp text-base text-ivory tracking-widest font-bold mb-2"
        >
          {title}
        </h2>
        {description && (
          <p className="font-jp-sans text-[12px] text-ivory-dim leading-relaxed mb-4">
            {description}
          </p>
        )}
        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-1.5 rounded border border-ivory-muted/30 text-[12px] font-jp-sans tracking-widest text-ivory-dim hover:text-ivory hover:border-brass transition"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            ref={confirmBtnRef}
            onClick={onConfirm}
            className={`px-4 py-1.5 rounded text-[12px] font-jp-sans font-bold tracking-widest transition ${
              destructive
                ? 'bg-vermilion/80 border border-vermilion text-ivory hover:bg-vermilion'
                : 'brass-surface text-ivory hover:brightness-110'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
