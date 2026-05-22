// Pokergo 最小 Service Worker。オフライン時の履歴閲覧（読み取り専用）を提供する将来拡張用の足場。
// 現状はインストール・アクティベートのみ実装し、フェッチは透過パス（=ブラウザ既定）。

const CACHE_VERSION = 'pokergo-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // 現状はキャッシュなし。Phase 6 で履歴 API の cache-then-network 等を検討。
  // event.respondWith を呼ばないとブラウザ既定 fetch にフォールバック
});

// CACHE_VERSION は将来のバージョンアップで強制更新するための識別子
self.CACHE_VERSION = CACHE_VERSION;
