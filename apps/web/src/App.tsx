import { useEffect, useState } from 'react';
import { flushPendingQueue } from './lib/api';
import { type PokergoUser, getStoredUser, loginAsGuest } from './lib/auth';
import { HistoryPage } from './pages/HistoryPage';
import { ServerTablePage } from './pages/ServerTablePage';
import { StatsPage } from './pages/StatsPage';
import { TablePage } from './pages/TablePage';
import { useTableStore } from './stores/tableStore';

type View = 'table' | 'server' | 'history' | 'stats';

const NAV: { key: View; label: string }[] = [
  { key: 'table', label: '卓 (ローカル)' },
  { key: 'server', label: '卓 (サーバ)' },
  { key: 'history', label: '履歴' },
  { key: 'stats', label: '統計' },
];

export default function App() {
  const [view, setView] = useState<View>('table');
  const [user, setUser] = useState<PokergoUser | null>(() => getStoredUser());
  const setMode = useTableStore((s) => s.setMode);

  useEffect(() => {
    if (!user) {
      loginAsGuest()
        .then(setUser)
        .catch(() => setUser(null));
    }
    void flushPendingQueue();
  }, [user]);

  // 卓ビューを切り替えると mode を同期する。ローカル/履歴/統計はローカルモード。
  useEffect(() => {
    setMode(view === 'server' ? 'server' : 'local');
  }, [view, setMode]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="px-4 py-3 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold tracking-tight">Pokergo</h1>
          <nav className="flex gap-1 text-xs flex-wrap">
            {NAV.map((n) => (
              <button
                key={n.key}
                type="button"
                onClick={() => setView(n.key)}
                className={`px-3 py-1 rounded ${view === n.key ? 'bg-accent' : 'bg-slate-800 hover:bg-slate-700'}`}
              >
                {n.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="text-xs text-slate-400">
          {user ? `${user.handle}` : 'ゲストモード初期化中…'} · Phase 3 prototype
        </div>
      </header>
      <main className="p-4">
        {view === 'table' && <TablePage />}
        {view === 'server' && <ServerTablePage />}
        {view === 'history' && <HistoryPage />}
        {view === 'stats' && <StatsPage />}
      </main>
    </div>
  );
}
