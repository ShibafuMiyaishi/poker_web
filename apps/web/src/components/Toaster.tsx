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
  info: 'bg-slate-800 border-slate-700 text-slate-100',
  success: 'bg-win/20 border-win/50 text-win',
  error: 'bg-lose/20 border-lose/50 text-lose',
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
          className={`text-xs px-3 py-2 rounded border shadow-lg text-left ${KIND_STYLE[t.kind]}`}
        >
          {t.text}
        </button>
      ))}
    </div>
  );
}
