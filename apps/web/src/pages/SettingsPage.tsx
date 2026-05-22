import { clearAuth, getStoredUser, startGoogleLogin } from '../lib/auth';

interface Props {
  onLogout: () => void;
}

export function SettingsPage({ onLogout }: Props) {
  const user = getStoredUser();
  return (
    <div className="max-w-2xl mx-auto space-y-4 text-sm">
      <h2 className="text-lg font-semibold">設定</h2>

      <section className="bg-slate-900/60 rounded p-3 border border-slate-800">
        <h3 className="text-sm font-semibold mb-2">アカウント</h3>
        {user ? (
          <div className="text-xs space-y-1">
            <div className="text-slate-400">
              ハンドル: <span className="text-slate-100">{user.handle}</span>
            </div>
            <div className="text-slate-400">
              user_id: <span className="font-mono text-[10px] text-slate-300">{user.id}</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400">未ログイン</p>
        )}
        <div className="mt-3 flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={startGoogleLogin}
            className="text-xs px-3 py-1.5 rounded bg-accent hover:bg-blue-500 font-semibold"
          >
            Google でログイン
          </button>
          <button
            type="button"
            onClick={() => {
              clearAuth();
              onLogout();
            }}
            className="text-xs px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700"
          >
            ログアウト（ゲストに戻る）
          </button>
        </div>
      </section>

      <section className="bg-slate-900/60 rounded p-3 border border-slate-800">
        <h3 className="text-sm font-semibold mb-2">バージョン / 情報</h3>
        <ul className="text-xs text-slate-400 space-y-1">
          <li>Pokergo v1 候補ビルド</li>
          <li>
            ソース:{' '}
            <a
              href="https://github.com/ShibafuMiyaishi/poker_web"
              className="text-accent hover:underline"
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
