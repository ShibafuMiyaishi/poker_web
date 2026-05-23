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

interface NavItem {
  key: View;
  jp: string;
  en: string;
}

const NAV: NavItem[] = [
  { key: 'table', jp: '卓', en: 'Table' },
  { key: 'server', jp: '相席', en: 'Online' },
  { key: 'history', jp: '履歴', en: 'History' },
  { key: 'stats', jp: '統計', en: 'Stats' },
];

const FOOTER_NAV: NavItem[] = [
  { key: 'settings', jp: '設定', en: 'Settings' },
  { key: 'terms', jp: '利用規約', en: 'Terms' },
  { key: 'privacy', jp: 'プライバシー', en: 'Privacy' },
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
    <div className="min-h-screen text-ivory flex flex-col">
      {/* ヘッダ: sticky で常時表示、brass の細線 + 編集デザイン */}
      <header className="sticky top-0 z-40 border-b border-brass/25 bg-ink-deepest/85 backdrop-blur-md supports-[backdrop-filter]:bg-ink-deepest/70">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brass to-transparent" />
        <div className="px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between flex-wrap gap-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
            <button
              type="button"
              onClick={() => setView('table')}
              className="flex items-baseline gap-2 group"
            >
              <span className="font-display font-bold text-xl sm:text-2xl tracking-tight brass-text">
                Pokergo
              </span>
              <span className="font-jp text-[10px] text-ivory-muted tracking-widest group-hover:text-brass transition">
                ポーカーゴー
              </span>
            </button>
            <nav className="flex gap-0 text-xs flex-wrap">
              {NAV.map((n) => (
                <button
                  key={n.key}
                  type="button"
                  onClick={() => setView(n.key)}
                  className={`relative px-3 py-2 transition group ${
                    view === n.key ? 'text-brass' : 'text-ivory-dim hover:text-ivory'
                  }`}
                >
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-jp text-sm">{n.jp}</span>
                    <span className="font-display italic text-[10px] tracking-widest uppercase opacity-70">
                      {n.en}
                    </span>
                  </div>
                  {view === n.key && (
                    <div className="absolute bottom-0 left-2 right-2 h-px bg-gradient-to-r from-transparent via-brass to-transparent" />
                  )}
                </button>
              ))}
            </nav>
          </div>
          <div className="text-[11px] flex items-center gap-3 flex-wrap">
            {user ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="font-display italic text-[10px] text-ivory-muted tracking-widest uppercase">
                    Player
                  </span>
                  <span className="font-jp text-ivory text-sm tracking-wider">{user.handle}</span>
                </div>
                <button
                  type="button"
                  onClick={startGoogleLogin}
                  className="px-3 py-1 rounded brass-surface text-[10px] font-display tracking-widest hover:brightness-110 transition"
                >
                  Google サインイン
                </button>
              </>
            ) : (
              <span className="font-display italic text-ivory-muted">authenticating…</span>
            )}
          </div>
        </div>
      </header>

      {/* メインビュー */}
      <main className="p-3 sm:p-6 flex-1 max-w-7xl w-full mx-auto">
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

      {/* フッタ: 編集デザイン的、brass ライン */}
      <footer className="relative border-t border-brass/20 bg-gradient-to-t from-ink-deepest to-transparent">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brass/40 to-transparent" />
        <div className="px-3 sm:px-6 py-4 flex items-center justify-between text-[10px] text-ivory-muted flex-wrap gap-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 font-display italic tracking-widest">
            <span className="font-jp tracking-widest text-ivory-dim">仮想チップのみ</span>
            <span className="opacity-60">·</span>
            <span>virtual chips only — no real-money exchange</span>
          </div>
          <nav className="flex gap-4">
            {FOOTER_NAV.map((n) => (
              <button
                key={n.key}
                type="button"
                onClick={() => setView(n.key)}
                className="flex items-baseline gap-1 hover:text-brass transition"
              >
                <span className="font-jp text-xs">{n.jp}</span>
                <span className="font-display italic text-[10px] tracking-widest uppercase opacity-70">
                  {n.en}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </footer>

      <Toaster />
    </div>
  );
}
