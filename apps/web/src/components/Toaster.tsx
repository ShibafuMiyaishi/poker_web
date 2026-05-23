import { useEffect } from 'react';
import { create } from 'zustand';

type ToastKind = 'info' | 'success' | 'error';

interface Toast {
  id: number;
  kind: ToastKind;
  text: string;
}

interface ToastStore {
  items: Toast[];
  push: (t: Omit<Toast, 'id'>) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;
export const useToastStore = create<ToastStore>((set) => ({
  items: [],
  push: (t) =>
    set((s) => ({
      items: [...s.items, { ...t, id: nextId++ }].slice(-5),
    })),
  dismiss: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}));

export function toast(text: string, kind: ToastKind = 'info'): void {
  useToastStore.getState().push({ text, kind });
}

const KIND_STYLE: Record<ToastKind, string> = {
  info: 'bg-gradient-to-b from-ink-deep to-ink border-brass/40 text-ivory',
  success:
    'bg-gradient-to-b from-jade/20 to-jade/5 border-jade/50 text-jade-glow shadow-[0_0_18px_rgba(110,231,183,0.25)]',
  error: 'bg-gradient-to-b from-crimson/20 to-crimson/5 border-crimson/50 text-crimson-glow',
};

const KIND_LABEL: Record<ToastKind, string> = {
  info: '通知',
  success: '完了',
  error: '失敗',
};

export function Toaster() {
  const items = useToastStore((s) => s.items);
  const dismiss = useToastStore((s) => s.dismiss);

  useEffect(() => {
    if (items.length === 0) return;
    const timers = items.map((t) => setTimeout(() => dismiss(t.id), 4000));
    return () => {
      for (const t of timers) clearTimeout(t);
    };
  }, [items, dismiss]);

  if (items.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-xs">
      {items.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => dismiss(t.id)}
          className={`relative text-xs px-4 py-2 rounded-md border shadow-card text-left flex items-baseline gap-2 ${KIND_STYLE[t.kind]} animate-verdict`}
        >
          <span className="font-jp text-[10px] tracking-widest opacity-80">
            {KIND_LABEL[t.kind]}
          </span>
          <span className="font-display flex-1">{t.text}</span>
        </button>
      ))}
    </div>
  );
}
