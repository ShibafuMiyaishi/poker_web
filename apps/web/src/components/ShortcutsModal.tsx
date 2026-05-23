import { useEffect, useState } from 'react';

// 「?」キーで開くキーボードショートカット一覧モーダル。
// discoverability: アプリ内 keyboard ショートカットを忘れたユーザーが瞬時に確認できる。
const SHORTCUTS: Array<{ key: string; jp: string; en: string }> = [
  { key: 'F', jp: 'フォールド', en: 'Fold' },
  { key: 'C', jp: 'チェック / コール', en: 'Check / Call' },
  { key: 'R', jp: 'ベット / レイズ', en: 'Bet / Raise' },
  { key: 'A', jp: 'オールイン', en: 'All-in' },
  { key: '?', jp: 'このヘルプ', en: 'Show this help' },
  { key: 'Esc', jp: 'モーダルを閉じる', en: 'Close modal' },
];

export function ShortcutsModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // input/textarea にフォーカスがある時はトリガーしない
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (target?.isContentEditable) return;
      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;
  return (
    <div
      // biome-ignore lint/a11y/useSemanticElements: dialog 要素はブラウザ default スタイル衝突のため div
      role="dialog"
      aria-modal="true"
      aria-label="キーボードショートカット一覧"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-abyss/85 backdrop-blur-sm animate-rise"
      onClick={() => setOpen(false)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') setOpen(false);
      }}
    >
      <div
        className="relative w-full max-w-md rounded-lg border border-brass/50 bg-gradient-to-b from-ink-deep to-ink-abyss shadow-[0_30px_80px_-20px_rgba(245,215,122,0.35)] p-6 paper-noise animate-stamp"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-brass to-transparent" />
        <h2 className="font-display font-bold text-xl brass-text tracking-tight mb-1">
          キーボードショートカット
        </h2>
        <p className="font-jp-sans text-[11px] text-ivory-muted tracking-widest mb-4">
          ハンド中の素早い操作用 (input フォーカス中は無効)
        </p>
        <table className="w-full text-sm">
          <tbody>
            {SHORTCUTS.map((s) => (
              <tr key={s.key} className="border-b border-brass/10 last:border-0">
                <td className="py-1.5 pr-3 w-16">
                  <kbd className="inline-block px-2 py-0.5 rounded border border-brass/45 bg-ink-deepest/70 text-brass-light font-mono-tabular text-xs">
                    {s.key}
                  </kbd>
                </td>
                <td className="py-1.5 font-jp-sans text-ivory text-sm">{s.jp}</td>
                <td className="py-1.5 font-display italic text-[10px] text-ivory-muted text-right">
                  {s.en}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-[11px] px-4 py-1.5 rounded brass-surface text-ivory font-jp-sans tracking-widest hover:brightness-110"
          >
            閉じる (Esc)
          </button>
        </div>
        <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-brass to-transparent" />
      </div>
    </div>
  );
}
