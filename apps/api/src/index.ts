// Workers エントリポイント。Phase 3 で Hono ルーターと TableDO の export を実装予定。
// 現状はビルドが通る最小スケルトン。

export default {
  async fetch(): Promise<Response> {
    return new Response('pokergo-api: not implemented yet', { status: 501 });
  },
};
