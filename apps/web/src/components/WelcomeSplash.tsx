import { useEffect, useRef, useState } from 'react';
import { LogoMark } from './primitives/LogoMark';

const KEY = 'pokergo_seen_intro_v1';

// 初回訪問時のみ表示する歓迎モーダル。Vault っぽい brass モチーフ + 朱印。
// 日本のポーカープレイヤーがログイン体験する最初の 1 秒を演出する。
export function WelcomeSplash() {
  const [seen, setSeen] = useState<boolean>(() => {
    if (typeof localStorage === 'undefined') return true;
    return localStorage.getItem(KEY) === '1';
  });
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const dismissBtnRef = useRef<HTMLButtonElement | null>(null);

  // body スクロール抑止 + 初期フォーカス。
  // 注意: dialog 自身も #root の子として描画されるため #root に inert を付けると
  // dialog 内のボタンまで無効化される。代わりに aria-modal="true" + 下の focus trap で a11y を担保する。
  useEffect(() => {
    if (seen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dismissBtnRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, [seen]);

  // フォーカストラップ: dialog 内の最初/最後の要素で Tab を循環
  useEffect(() => {
    if (seen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Esc では閉じない (初回必読、誤操作で見逃さないように) — 仕様判断
        return;
      }
      if (e.key !== 'Tab') return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [seen]);

  if (seen) return null;

  const dismiss = () => {
    localStorage.setItem(KEY, '1');
    setSeen(true);
  };

  return (
    <div
      ref={dialogRef}
      // biome-ignore lint/a11y/useSemanticElements: <dialog> 要素はブラウザ default のスタイリング (max-width/inset) と衝突するため、role="dialog" の <div> で実装する
      role="dialog"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-abyss/85 backdrop-blur-sm animate-rise"
      aria-modal="true"
      aria-label="Pokergo へようこそ"
    >
      <div className="relative w-full max-w-md rounded-lg border border-brass/50 bg-gradient-to-b from-ink-deep to-ink-abyss shadow-[0_30px_80px_-20px_rgba(245,215,122,0.35)] p-6 sm:p-8 paper-noise animate-stamp">
        {/* brass top hairline */}
        <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-brass to-transparent" />

        <div className="flex flex-col items-center text-center gap-4">
          <LogoMark size={64} />

          <div className="flex items-baseline gap-3">
            <h2 className="font-display font-black text-3xl brass-text tracking-tight">Pokergo</h2>
            <span className="font-jp text-[10px] text-ivory-muted tracking-widest">
              ポーカーゴー
            </span>
          </div>

          <div className="ink-seal w-12 h-12 flex items-center justify-center text-2xl shrink-0">
            役
          </div>

          <p className="font-jp text-sm sm:text-base text-ivory-dim leading-relaxed max-w-sm">
            ようこそ、深夜の植物園カジノへ。
            <br />
            CPU 7 体と一卓を囲み、ハンドごとの最善手を学べる、
            <span className="brass-text font-bold">Botanical Vault</span> の体験。
          </p>

          <ul className="text-[11px] font-jp text-ivory-muted space-y-1 mt-1 max-w-sm w-full">
            <li className="flex items-baseline justify-between gap-3 border-b border-brass/15 pb-1">
              <span>各アクションの EV / GTO 比較</span>
              <span className="brass-text font-mono-tabular">自動</span>
            </li>
            <li className="flex items-baseline justify-between gap-3 border-b border-brass/15 pb-1">
              <span>ショートカット F / C / R / A</span>
              <span className="brass-text font-mono-tabular">対応</span>
            </li>
            <li className="flex items-baseline justify-between gap-3">
              <span>仮想チップのみ・現実通貨と無関係</span>
              <span className="text-vermilion-light font-jp font-bold">★</span>
            </li>
          </ul>

          <button
            ref={dismissBtnRef}
            type="button"
            onClick={dismiss}
            className="mt-3 px-6 py-2.5 rounded-md font-display tracking-widest text-sm brass-surface text-ivory hover:brightness-110 transition focus-visible:ring-2 focus-visible:ring-brass-glow"
          >
            卓につく ▸
          </button>

          <p className="text-[10px] font-jp text-ivory-muted">(次回からは表示されません)</p>
        </div>

        {/* brass bottom hairline */}
        <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-brass to-transparent" />
      </div>
    </div>
  );
}
