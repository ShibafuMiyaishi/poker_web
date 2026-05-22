import { useEffect, useState } from 'react';
import { flushPendingQueue } from './lib/api';
import { type PokergoUser, getStoredUser, loginAsGuest } from './lib/auth';
import { HistoryPage } from './pages/HistoryPage';
import { TablePage } from './pages/TablePage';

type View = 'table' | 'history';

export default function App() {
  const [view, setView] = useState<View>('table');
  const [user, setUser] = useState<PokergoUser | null>(() => getStoredUser());

  useEffect(() => {
    if (!user) {
      loginAsGuest()
        .then(setUser)
        .catch(() => setUser(null));
    }
    void flushPendingQueue();
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="px-4 py-3 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold tracking-tight">Pokergo</h1>
          <nav className="flex gap-1 text-xs">
            <button
              type="button"
              onClick={() => setView('table')}
              className={`px-3 py-1 rounded ${view === 'table' ? 'bg-accent' : 'bg-slate-800 hover:bg-slate-700'}`}
            >
              卓
            </button>
            <button
              type="button"
              onClick={() => setView('history')}
              className={`px-3 py-1 rounded ${view === 'history' ? 'bg-accent' : 'bg-slate-800 hover:bg-slate-700'}`}
            >
              履歴
            </button>
          </nav>
        </div>
        <div className="text-xs text-slate-400">
          {user ? `${user.handle}` : 'ゲストモード初期化中…'} · Phase 2 prototype
        </div>
      </header>
      <main className="p-4">{view === 'table' ? <TablePage /> : <HistoryPage />}</main>
    </div>
  );
}
