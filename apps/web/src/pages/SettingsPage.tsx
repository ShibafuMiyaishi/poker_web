import { SectionLabel } from '../components/primitives/SectionLabel';
import { clearAuth, getStoredUser, startGoogleLogin } from '../lib/auth';
import { useTableStore } from '../stores/tableStore';

interface Props {
  onLogout: () => void;
}

export function SettingsPage({ onLogout }: Props) {
  const user = getStoredUser();
  const sfxEnabled = useTableStore((s) => s.sfxEnabled);
  const motionEnabled = useTableStore((s) => s.motionEnabled);
  const setSfxEnabled = useTableStore((s) => s.setSfxEnabled);
  const setMotionEnabled = useTableStore((s) => s.setMotionEnabled);

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
            <details className="text-[10px]">
              <summary className="cursor-pointer font-jp text-ivory-muted hover:text-brass tracking-widest select-none">
                ID を表示 ▾
              </summary>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-jp text-ivory-muted w-20 shrink-0">ID</span>
                <span className="font-mono-tabular text-[10px] text-ivory-dim break-all">
                  {user.id}
                </span>
              </div>
            </details>
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

      {/* 体験設定 (sfx / motion toggle) */}
      <section className="relative rounded-md border border-brass/25 bg-gradient-to-b from-ink-deep/95 to-ink/95 p-5 shadow-card">
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-brass/40 to-transparent" />
        <h3 className="font-jp text-base text-ivory tracking-widest mb-3">体験</h3>
        <div className="space-y-3">
          <ToggleRow
            label="サウンド"
            description="将来の SFX (チップ音 / カード音) 用フラグ。現状は予約。"
            checked={sfxEnabled}
            onChange={setSfxEnabled}
          />
          <ToggleRow
            label="アニメーション"
            description="カードやチップの動きを軽くしたい場合は off に。"
            checked={motionEnabled}
            onChange={setMotionEnabled}
          />
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

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

// brass switch UI: ink track + brass thumb。on で thumb が右に移動 + ring 明るく。
function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="font-jp text-sm text-ivory tracking-wider">{label}</div>
        <div className="font-jp text-[11px] text-ivory-muted mt-0.5">{description}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-6 rounded-full border transition-colors shrink-0 mt-0.5 ${
          checked
            ? 'bg-brass/30 border-brass-light/55 shadow-[0_0_10px_rgba(245,215,122,0.3)]'
            : 'bg-ink-deepest border-ink-line'
        }`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${
            checked
              ? 'left-6 bg-gradient-to-br from-brass-glow to-brass-deep shadow-[0_2px_4px_rgba(0,0,0,0.5)]'
              : 'left-0.5 bg-gradient-to-br from-ivory-muted to-ink-line'
          }`}
        />
      </button>
    </div>
  );
}
