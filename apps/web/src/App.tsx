import { useEffect, useState } from 'react';
import { AdSlot } from './components/AdSlot';
import { Toaster } from './components/Toaster';
import { LogoMark } from './components/primitives/LogoMark';
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

// bilingual を絞る: ナビは漢字のみ。en は H1 等、選ばれた箇所だけ。
const NAV: { key: View; label: string }[] = [
  { key: 'table', label: '卓' },
  { key: 'server', label: '相席' },
  { key: 'history', label: '記録' },
  { key: 'stats', label: '統計' },
];

const FOOTER_NAV: { key: View; label: string }[] = [
  { key: 'settings', label: '設定' },
  { key: 'terms', label: '規約' },
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
    <div className="min-h-screen text-ivory flex flex-col relative">
      <a href="#main" className="skip-link">
        本文へスキップ
      </a>

      {/* ヘッダ: sticky 常駐、brass の細線 */}
      <header className="sticky top-0 z-40 border-b border-brass/30 bg-ink-deepest/85 backdrop-blur-md supports-[backdrop-filter]:bg-ink-deepest/70">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brass to-transparent" />
        <div className="px-3 sm:px-6 py-3 flex items-center justify-between flex-wrap gap-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
            <button
              type="button"
              onClick={() => setView('table')}
              className="flex items-center gap-2.5 group"
              aria-label="Pokergo ホームへ"
            >
              <LogoMark size={32} className="group-hover:rotate-3 transition-transform" />
              <span className="font-display font-black text-2xl tracking-tight brass-text leading-none">
                Pokergo
              </span>
            </button>
            <nav className="flex gap-0 text-sm flex-wrap" aria-label="主ナビゲーション">
              {NAV.map((n) => (
                <button
                  key={n.key}
                  type="button"
                  onClick={() => setView(n.key)}
                  className={`relative px-3 py-2 font-jp tracking-widest transition ${
                    view === n.key ? 'text-brass-light' : 'text-ivory-dim hover:text-ivory'
                  }`}
                  aria-current={view === n.key ? 'page' : undefined}
                >
                  {n.label}
                  {view === n.key && (
                    <div className="absolute -bottom-px left-2 right-2 h-px bg-gradient-to-r from-transparent via-brass-light to-transparent" />
                  )}
                </button>
              ))}
            </nav>
          </div>
          <div className="text-[11px] flex items-center gap-3 flex-wrap">
            {user ? (
              <>
                <span className="font-jp text-ivory text-sm tracking-wider">{user.handle}</span>
                <button
                  type="button"
                  onClick={startGoogleLogin}
                  className="px-3 py-1 rounded-md brass-surface text-[10px] font-display tracking-widest hover:brightness-110 transition"
                >
                  Google サインイン
                </button>
              </>
            ) : (
              <span className="font-display italic text-ivory-muted">認証中…</span>
            )}
          </div>
        </div>
      </header>

      {/* メインビュー */}
      <main id="main" className="p-3 sm:p-6 flex-1 max-w-7xl w-full mx-auto relative z-10">
        <div className="animate-rise" key={view}>
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
        </div>
      </main>

      {/* フッタ: 漢字主体 */}
      <footer className="relative border-t border-brass/20 bg-gradient-to-t from-ink-deepest to-transparent z-10">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brass/40 to-transparent" />
        <div className="px-3 sm:px-6 py-4 flex items-center justify-between text-[10px] text-ivory-muted flex-wrap gap-3 max-w-7xl mx-auto">
          <div className="font-jp tracking-widest">仮想チップのみ・現実通貨との交換不可</div>
          <nav className="flex gap-4" aria-label="フッタナビゲーション">
            {FOOTER_NAV.map((n) => (
              <button
                key={n.key}
                type="button"
                onClick={() => setView(n.key)}
                className="font-jp text-xs hover:text-brass transition tracking-widest"
              >
                {n.label}
              </button>
            ))}
          </nav>
        </div>
      </footer>

      <Toaster />
    </div>
  );
}
