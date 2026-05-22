import type { Env } from '../env';

// 仕様 §5 / §6.2 の TableDO スケルトン。Phase 3 でゲームエンジン進行・
// ホールカード可視性フィルタ・WebSocket メッセージのプロトコル処理を実装する。
// 現状は WebSocket Hibernation API の接続と「未実装」レスポンスのみ。
export class TableDO implements DurableObject {
  private readonly state: DurableObjectState;
  // biome-ignore lint/correctness/noUnusedPrivateClassMembers: Phase 3 で env から DB を使う
  private readonly env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair) as [WebSocket, WebSocket];
      // Hibernation API: addEventListener ではなく acceptWebSocket を使う
      this.state.acceptWebSocket(server);
      return new Response(null, { status: 101, webSocket: client });
    }
    return new Response('TableDO scaffold (Phase 3 で本実装)', {
      status: 200,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }

  async webSocketMessage(ws: WebSocket, _message: string | ArrayBuffer): Promise<void> {
    // Phase 3 メモ:
    //   - JSON.parse → ClientMessage 型に narrowing
    //   - subscribe/action/sit/leave/ping をディスパッチ
    //   - 出力は必ず sendToSeat / broadcast 経由でホールカード可視性をフィルタ
    //   - state.storage.put('tableState', ...) で都度永続化（hibernation 復帰対応）
    ws.send(
      JSON.stringify({
        type: 'error',
        code: 'not_implemented',
        message: 'TableDO は Phase 3 で本実装予定',
      }),
    );
  }

  async webSocketClose(
    _ws: WebSocket,
    _code: number,
    _reason: string,
    _wasClean: boolean,
  ): Promise<void> {
    // Phase 3: AFK 検知・自動退席・CPU 補充・最後に state.storage.put で永続化
  }

  async webSocketError(_ws: WebSocket, _error: unknown): Promise<void> {
    // Phase 3: エラー時も state.storage を保つ
  }

  // Phase 3 で実装する seat-aware メッセージング (hole_cards 漏洩を型で縛るための骨格)。
  // private sendToSeat(_seat: Seat, _payload: ServerMessage): void { /* hole_cards を seat ごとにフィルタ */ }
  // private broadcast(_fn: (seat: Seat) => ServerMessage): void { /* seat ごとに sendToSeat */ }
}
