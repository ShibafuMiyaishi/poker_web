import { useEffect, useState } from 'react';
import { AdSlot } from './components/AdSlot';
import { Toaster } from './components/Toaster';
import { flushPendingQueue } from './lib/api';
import {
  type PokergoUser,
  clearAuth,
  consumeJwtFromUrl,
  getStoredUser,
  loginAsGuest,
  startGoogleLogin,
} from './lib/auth';
import { HistoryPage } from './pages/HistoryPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { ServerTablePage } from './pages/ServerTablePage';
import { SettingsPage } from './pages/SettingsPage';
import { StatsPage } from './pages/StatsPage';
import { TablePage } from './pages/TablePage';
import { TermsPage } from './pages/TermsPage';
import { useTableStore } from './stores/tableStore';

type View = 'table' | 'server' | 'history' | 'stats' | 'settings' | 'terms' | 'privacy';

const NAV: { key: View; label: string }[] = [
  { key: 'table', label: '卓 (ローカル)' },
  { key: 'server', label: '卓 (サーバ)' },
  { key: 'history', label: '履歴' },
  { key: 'stats', label: '統計' },
];

const FOOTER_NAV: { key: View; label: string }[] = [
  { key: 'settings', label: '設定' },
  { key: 'terms', label: '利用規約' },
  { key: 'privacy', label: 'プライバシー' },
];

export default function App() {
  const [view, setView] = useState<View>('table');
  const [user, setUser] = useState<PokergoUser | null>(() => {
    const fromUrl = consumeJwtFromUrl();
    return fromUrl ?? getStoredUser();
  });
  const setMode = useTableStore((s) => s.setMode);

  useEffect(() => {
    if (!user) {
      loginAsGuest()
        .then(setUser)
        .catch(() => setUser(null));
    }
    void flushPendingQueue();
  }, [user]);

  const handleLogout = () => {
    clearAuth();
    setUser(null);
  };

  useEffect(() => {
    setMode(view === 'server' ? 'server' : 'local');
  }, [view, setMode]);

  const showAds = view === 'history' || view === 'stats';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="px-3 sm:px-4 py-3 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <button
            type="button"
            onClick={() => setView('table')}
            className="text-lg font-semibold tracking-tight hover:text-accent"
          >
            Pokergo
          </button>
          <nav className="flex gap-1 text-xs flex-wrap">
            {NAV.map((n) => (
              <button
                key={n.key}
                type="button"
                onClick={() => setView(n.key)}
                className={`px-2.5 py-1 rounded ${view === n.key ? 'bg-accent' : 'bg-slate-800 hover:bg-slate-700'}`}
              >
                {n.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
          {user ? (
            <>
              <span className="text-slate-200">{user.handle}</span>
              <button
                type="button"
                onClick={startGoogleLogin}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px]"
              >
                Google ログイン
              </button>
            </>
          ) : (
            <span>ゲストモード初期化中…</span>
          )}
        </div>
      </header>

      <main className="p-3 sm:p-4 flex-1">
        {view === 'table' && <TablePage />}
        {view === 'server' && <ServerTablePage />}
        {view === 'history' && (
          <div className="space-y-4">
            <HistoryPage />
            {showAds && <AdSlot slotId="history-bottom" className="mt-4" />}
          </div>
        )}
        {view === 'stats' && (
          <div className="space-y-4">
            <StatsPage />
            {showAds && <AdSlot slotId="stats-bottom" className="mt-4" />}
          </div>
        )}
        {view === 'settings' && <SettingsPage onLogout={handleLogout} />}
        {view === 'terms' && <TermsPage />}
        {view === 'privacy' && <PrivacyPage />}
      </main>

      <footer className="px-3 sm:px-4 py-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 flex-wrap gap-2">
        <span>仮想チップのみ・現実通貨との交換不可</span>
        <nav className="flex gap-3">
          {FOOTER_NAV.map((n) => (
            <button
              key={n.key}
              type="button"
              onClick={() => setView(n.key)}
              className="hover:text-slate-300"
            >
              {n.label}
            </button>
          ))}
        </nav>
      </footer>

      <Toaster />
    </div>
  );
}
