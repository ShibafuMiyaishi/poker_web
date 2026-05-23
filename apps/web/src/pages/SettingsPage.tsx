import { SectionLabel } from '../components/primitives/SectionLabel';
import { clearAuth, getStoredUser, startGoogleLogin } from '../lib/auth';

interface Props {
  onLogout: () => void;
}

export function SettingsPage({ onLogout }: Props) {
  const user = getStoredUser();
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <header className="border-b border-brass/20 pb-3">
        <SectionLabel jp="設定" en="Settings" size="lg" />
      </header>

      <section className="relative rounded-md border border-brass/25 bg-gradient-to-b from-ink-deep/95 to-ink/95 p-5 shadow-card">
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-brass/40 to-transparent" />
        <h3 className="font-jp text-base text-ivory tracking-widest mb-3">アカウント</h3>
        {user ? (
          <div className="text-xs space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="font-jp text-ivory-muted w-20 shrink-0">ハンドル</span>
              <span className="font-display text-ivory text-base">{user.handle}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-jp text-ivory-muted w-20 shrink-0">ID</span>
              <span className="font-mono-tabular text-[10px] text-ivory-dim">{user.id}</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-ivory-muted font-jp">未ログイン</p>
        )}
        <div className="mt-4 flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={startGoogleLogin}
            className="text-xs px-4 py-2 rounded-md brass-surface text-ivory font-jp tracking-widest hover:brightness-110 transition"
          >
            Google でサインイン
          </button>
          <button
            type="button"
            onClick={() => {
              clearAuth();
              onLogout();
            }}
            className="text-xs px-4 py-2 rounded-md border border-crimson/40 bg-crimson/10 text-crimson-glow font-jp tracking-widest hover:bg-crimson/20 transition"
          >
            ログアウト
          </button>
        </div>
      </section>

      <section className="relative rounded-md border border-brass/25 bg-gradient-to-b from-ink-deep/95 to-ink/95 p-5 shadow-card">
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-brass/40 to-transparent" />
        <h3 className="font-jp text-base text-ivory tracking-widest mb-3">情報</h3>
        <ul className="text-xs text-ivory-dim space-y-1.5">
          <li>
            <span className="font-display italic text-brass">Pokergo</span>
            <span className="font-jp ml-2">v1 候補ビルド</span>
          </li>
          <li>
            <span className="font-jp">ソース:</span>{' '}
            <a
              href="https://github.com/ShibafuMiyaishi/poker_web"
              className="text-brass hover:text-brass-light underline-offset-2 hover:underline"
              target="_blank"
              rel="noreferrer noopener"
            >
              GitHub
            </a>
          </li>
        </ul>
      </section>
    </div>
  );
}
