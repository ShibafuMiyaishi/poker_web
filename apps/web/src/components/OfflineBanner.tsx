import { useEffect, useState } from 'react';

// オフライン検知バナー。navigator.online + online/offline event を監視。
// ユーザーが「保存されてない / 同期されてない」状況を理解できるように。
export function OfflineBanner() {
  const [online, setOnline] = useState<boolean>(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);

  if (online) return null;
  return (
    <div
      // biome-ignore lint/a11y/useSemanticElements: <output> はフォーム用、ここはアプリ全体の通知なので div + role="status"
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-50 bg-vermilion/90 text-ivory text-center py-1.5 text-xs font-jp-sans tracking-widest shadow-lg backdrop-blur-sm"
    >
      ⚠ オフライン: 接続復旧後に履歴を同期します
    </div>
  );
}
