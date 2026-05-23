import {
  CPU_PROFILES,
  type CpuName,
  type HandPayload,
  type HandState,
  type PlayerAction,
  type TableState,
  type WinAllocation,
  advanceStreet,
  applyAction,
  applyHumanAction,
  buildHandPayload,
  createInitialTableState,
  cryptoRng,
  decideAction,
  fillEmptySeatsWithCpu,
  filterHandStateForSeat,
  findHumanSeat,
  handStateToWire,
  isHandOver,
  settleTableHand,
  sitDownHuman,
  standUp,
  startTableHand,
  toPokerStarsText,
} from '@pokergo/engine';
import type { Seat } from '@pokergo/shared';
import { insertHand } from '../db/hands';
import type { Env } from '../env';
import { verifyJwt } from '../lib/jwt';
import { requireJwtSecret } from '../lib/secrets';

const STORAGE_KEY = 'tableState';
const DEFAULT_TABLE_ID = 'main';
const NEXT_HAND_DELAY_MS = 2500;
const AFK_TIMEOUT_MS = 60_000; // 仕様 F-D-02: 60 秒不応答で自動退席
const CPU_THINK_MIN_MS = 1000;
const CPU_THINK_MAX_MS = 3500;

interface WsAttachment {
  userId: string;
  handle: string;
  subscribed: boolean;
  // rate limit 用: 直近のアクションタイムスタンプ (ms epoch) を最大 RATE_LIMIT_WINDOW 件保持
  actionTimes: number[];
}

// 仕様 §12.3: 1 秒に 5 アクション以上で警告、10 以上で切断
const RATE_LIMIT_WINDOW_MS = 1000;
const RATE_LIMIT_WARN = 5;
const RATE_LIMIT_DISCONNECT = 10;

interface ClientMessageRaw {
  type?: string;
  seatNo?: number;
  action?: string;
  amount?: number;
}

// 仕様 §5 / §6.2 の TableDO 本実装。
// - state.storage に TableState を永続化（Hibernation 復帰対応）
// - WebSocket Hibernation API (acceptWebSocket / serializeAttachment) を使用
// - サーバ権威でハンド進行、CPU を内部駆動、ホールカードを seat ごとにフィルタ
// - hand 終了時に D1 へ flush
export class TableDO implements DurableObject {
  private readonly ctx: DurableObjectState;
  private readonly env: Env;
  private state: TableState | null = null;

  constructor(ctx: DurableObjectState, env: Env) {
    this.ctx = ctx;
    this.env = env;
  }

  private async ensureState(): Promise<TableState> {
    if (this.state) return this.state;
    const stored = (await this.ctx.storage.get<TableState>(STORAGE_KEY)) ?? null;
    if (stored) {
      this.state = stored;
    } else {
      this.state = createInitialTableState(DEFAULT_TABLE_ID, 5, 10);
      await this.ctx.storage.put(STORAGE_KEY, this.state);
    }
    return this.state;
  }

  private async persist(): Promise<void> {
    if (this.state) await this.ctx.storage.put(STORAGE_KEY, this.state);
  }

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade') !== 'websocket') {
      const state = await this.ensureState();
      return new Response(
        JSON.stringify({ tableId: state.tableId, seats: state.seats.length, handNo: state.handNo }),
        { headers: { 'content-type': 'application/json' } },
      );
    }

    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    if (!token) return new Response('token required', { status: 401 });
    const secret = requireJwtSecret(this.env);
    const payload = await verifyJwt(token, secret);
    if (!payload) return new Response('invalid token', { status: 401 });

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair) as [WebSocket, WebSocket];
    this.ctx.acceptWebSocket(server);
    const attach: WsAttachment = {
      userId: payload.sub,
      handle: payload.handle,
      subscribed: false,
      actionTimes: [],
    };
    server.serializeAttachment(attach);
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer): Promise<void> {
    const text = typeof raw === 'string' ? raw : new TextDecoder().decode(raw);
    let msg: ClientMessageRaw;
    try {
      msg = JSON.parse(text) as ClientMessageRaw;
    } catch {
      this.sendError(ws, 'invalid_json', 'JSON parse failed');
      return;
    }
    const attach = ws.deserializeAttachment() as WsAttachment | null;
    if (!attach?.userId) {
      this.sendError(ws, 'unauthorized', 'no user attached');
      return;
    }
    await this.ensureState();

    try {
      switch (msg.type) {
        case 'subscribe':
          attach.subscribed = true;
          ws.serializeAttachment(attach);
          this.sendState(ws);
          return;
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          return;
        case 'sit':
          await this.handleSit(ws, attach, msg);
          return;
        case 'leave':
          await this.handleLeave(attach);
          return;
        case 'action':
          await this.handleAction(ws, attach, msg);
          return;
        default:
          this.sendError(ws, 'unknown_message', `unknown type: ${msg.type}`);
      }
    } catch (err) {
      this.sendError(ws, 'server_error', err instanceof Error ? err.message : 'unknown');
    }
  }

  private async handleSit(
    ws: WebSocket,
    attach: WsAttachment,
    msg: ClientMessageRaw,
  ): Promise<void> {
    if (!this.state) return;
    if (typeof msg.seatNo !== 'number' || msg.seatNo < 0 || msg.seatNo > 7) {
      this.sendError(ws, 'invalid_seat', 'seatNo (0-7) required');
      return;
    }
    // 仕様 §12.3: 同一ユーザーの複数席着座禁止。既に別席なら拒否する。
    const existing = findHumanSeat(this.state, attach.userId);
    if (existing !== null && existing !== msg.seatNo) {
      this.sendError(ws, 'already_seated', `already at seat ${existing}`);
      return;
    }
    try {
      this.state = sitDownHuman(this.state, {
        seatNo: msg.seatNo as Seat,
        userId: attach.userId,
        handle: attach.handle,
      });
    } catch (err) {
      this.sendError(ws, 'sit_failed', err instanceof Error ? err.message : 'cannot sit');
      return;
    }
    this.state = fillEmptySeatsWithCpu(this.state);
    await this.persist();
    this.broadcastState();
    await this.maybeStartHand();
  }

  private async handleLeave(attach: WsAttachment): Promise<void> {
    if (!this.state) return;
    this.state = standUp(this.state, attach.userId);
    await this.persist();
    this.broadcastState();
  }

  private async handleAction(
    ws: WebSocket,
    attach: WsAttachment,
    msg: ClientMessageRaw,
  ): Promise<void> {
    // 仕様 §12.3: アクション頻度制限。1 秒に 10 件以上で切断、5 件以上で警告。
    const now = Date.now();
    attach.actionTimes = attach.actionTimes.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    attach.actionTimes.push(now);
    if (attach.actionTimes.length >= RATE_LIMIT_DISCONNECT) {
      this.sendError(ws, 'rate_limit_exceeded', 'too many actions, disconnecting');
      ws.close(1008, 'rate_limit');
      return;
    }
    if (attach.actionTimes.length >= RATE_LIMIT_WARN) {
      this.sendError(ws, 'rate_limit_warning', 'slow down');
    }
    ws.serializeAttachment(attach);

    if (!this.state || !this.state.currentHand) {
      this.sendError(ws, 'no_hand', 'no hand in progress');
      return;
    }
    const seat = findHumanSeat(this.state, attach.userId);
    if (seat === null) {
      this.sendError(ws, 'not_seated', 'you are not seated');
      return;
    }
    if (this.state.currentHand.toAct !== seat) {
      this.sendError(
        ws,
        'not_your_turn',
        `expected seat ${this.state.currentHand.toAct ?? 'none'}`,
      );
      return;
    }
    if (!msg.action) {
      this.sendError(ws, 'invalid_action', 'action required');
      return;
    }
    const action = this.buildPlayerAction(seat, msg);
    if (!action) {
      this.sendError(ws, 'invalid_action', `unknown action: ${msg.action}`);
      return;
    }
    try {
      const r = applyHumanAction(this.state, seat, action);
      this.state = r.state;
    } catch (err) {
      this.sendError(ws, 'apply_failed', err instanceof Error ? err.message : 'error');
      return;
    }
    this.broadcastAction(seat, action);
    // ユーザーが時間内に応じたので AFK alarm を解除し、次イベントへ
    await this.ctx.storage.deleteAlarm();
    await this.persist();
    await this.scheduleNext();
  }

  private buildPlayerAction(seat: Seat, msg: ClientMessageRaw): PlayerAction | null {
    switch (msg.action) {
      case 'fold':
        return { seat, type: 'fold' };
      case 'check':
        return { seat, type: 'check' };
      case 'call':
        return { seat, type: 'call' };
      case 'all_in':
        return { seat, type: 'all_in' };
      case 'bet':
        return { seat, type: 'bet', amount: msg.amount ?? 0 };
      case 'raise':
        return { seat, type: 'raise', amount: msg.amount ?? 0 };
      default:
        return null;
    }
  }

  private async maybeStartHand(): Promise<void> {
    if (!this.state || this.state.currentHand) return;
    const playable = this.state.seats.filter(
      (s) => s.occupiedBy && s.stack >= (this.state?.config.bb ?? 10),
    );
    if (playable.length < 2) return;
    this.state = startTableHand(this.state, { handNo: this.state.handNo + 1 });
    if (!this.state.currentHand) return;
    this.broadcastHandStart();
    await this.persist();
    await this.scheduleNext();
  }

  // 次の 1 イベント（CPU 思考または人間の手番）をスケジュールする。
  // - 人間の手番: AFK_TIMEOUT_MS の alarm
  // - CPU の手番: CPU 思考遅延の alarm（人間らしさ演出）
  // - toAct === null かつストリート未到達: 即座に street を進める
  // - showdown または 1 人勝ち: finishHand
  private async scheduleNext(): Promise<void> {
    if (!this.state || !this.state.currentHand) return;

    // 「待ち時間 0」の遷移を先に消化する: ストリート切替や hand 終了
    while (this.state.currentHand && this.state.currentHand.toAct === null) {
      const cur = this.state.currentHand;
      if (cur.street === 'showdown' || isHandOver(cur)) {
        await this.finishHand();
        return;
      }
      const next = advanceStreet(cur);
      this.state = { ...this.state, currentHand: next };
      this.broadcastStreet(next.street, next.board);
    }
    await this.persist();
    if (!this.state.currentHand) return;

    const seat = this.state.currentHand.toAct;
    if (seat === null) return;
    const occ = this.state.seats[seat]?.occupiedBy;
    if (!occ) return;

    const delay =
      occ.type === 'human'
        ? AFK_TIMEOUT_MS
        : CPU_THINK_MIN_MS + Math.floor(this.randomMs() * (CPU_THINK_MAX_MS - CPU_THINK_MIN_MS));
    await this.ctx.storage.setAlarm(Date.now() + delay);
  }

  private randomMs(): number {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return ((buf[0] ?? 0) >>> 0) / 0x1_0000_0000;
  }

  async alarm(): Promise<void> {
    await this.ensureState();
    // ハンド進行中でない場合は次ハンドを開始 (finishHand 後の wait)
    if (!this.state?.currentHand) {
      await this.maybeStartHand();
      return;
    }
    const seat = this.state.currentHand.toAct;
    if (seat === null) {
      await this.scheduleNext();
      return;
    }
    const occ = this.state.seats[seat]?.occupiedBy;
    if (!occ) {
      await this.scheduleNext();
      return;
    }

    if (occ.type === 'human') {
      await this.handleAfkTimeout(seat, occ.userId);
    } else {
      await this.handleCpuTurn(seat, occ.name as CpuName);
    }
    await this.persist();
    await this.scheduleNext();
  }

  private async handleAfkTimeout(
    seat: import('@pokergo/shared').Seat,
    userId: string,
  ): Promise<void> {
    if (!this.state?.currentHand) return;
    const player = this.state.currentHand.players.get(seat);
    if (!player) return;
    const action: PlayerAction =
      player.currentBet === this.state.currentHand.currentBet
        ? { seat, type: 'check' }
        : { seat, type: 'fold' };
    try {
      const r = applyHumanAction(this.state, seat, action);
      this.state = r.state;
      this.broadcastAction(seat, action);
    } catch (err) {
      console.error('AFK auto-action failed:', err);
    }
    // 仕様 F-D-02: 60 秒不応答 → 自動退席 + CPU 補充
    this.state = standUp(this.state, userId);
    this.state = fillEmptySeatsWithCpu(this.state);
    this.broadcastState();
  }

  private async handleCpuTurn(
    seat: import('@pokergo/shared').Seat,
    cpuName: CpuName,
  ): Promise<void> {
    if (!this.state?.currentHand) return;
    const profile = CPU_PROFILES[cpuName] ?? CPU_PROFILES.Bravo;
    const action = decideAction(this.state.currentHand, seat, profile, cryptoRng);
    this.state = {
      ...this.state,
      currentHand: applyAction(this.state.currentHand, action),
    };
    this.broadcastAction(seat, action);
  }

  private async finishHand(): Promise<void> {
    if (!this.state || !this.state.currentHand) return;
    const finishedHand = this.state.currentHand;
    const result = settleTableHand(this.state);
    if (!result) return;
    this.state = result.state;
    this.broadcastHandEnd(finishedHand, result.winners);
    await this.persist();
    void this.persistToD1(finishedHand, result.winners);
    // alarm でハンド間 wait をスケジュールする。setTimeout は DO hibernation 中に消失するため不可。
    await this.ctx.storage.setAlarm(Date.now() + NEXT_HAND_DELAY_MS);
  }

  private async persistToD1(hand: HandState, winners: WinAllocation[]): Promise<void> {
    try {
      const labelMeta = (
        seat: Seat,
      ): { userId: string | null; cpuName: string | null; position: string } => {
        const occ = this.state?.seats[seat]?.occupiedBy ?? null;
        return {
          userId: occ?.type === 'human' ? occ.userId : null,
          cpuName: occ?.type === 'cpu' ? occ.name : null,
          position: '',
        };
      };
      const labelText = (seat: Seat): string => {
        const occ = this.state?.seats[seat]?.occupiedBy ?? null;
        if (occ?.type === 'human') return occ.handle;
        if (occ?.type === 'cpu') return occ.name;
        return `seat${seat}`;
      };
      const pokerText = toPokerStarsText(hand, winners, {
        tableName: 'Pokergo Table',
        handNumber: hand.handId,
        startedAt: new Date(),
        seatLabel: labelText,
        yourSeat: null,
      });
      const payload: HandPayload = buildHandPayload(hand, {
        tableId: this.state?.tableId ?? DEFAULT_TABLE_ID,
        handNo: this.state?.handNo ?? 0,
        startedAt: Date.now() - 30000,
        endedAt: Date.now(),
        pokerstarsText: pokerText,
        seatLabel: labelMeta,
        winners,
      });
      await insertHand(this.env, payload);
    } catch (err) {
      console.error('TableDO persistToD1 failed:', err);
    }
  }

  // 旧 setTimeout 版は DO hibernation で消失するため廃止。
  // 代わりに finishHand 内で ctx.storage.setAlarm を呼び、alarm() で maybeStartHand する。

  async webSocketClose(): Promise<void> {
    await this.persist();
  }

  async webSocketError(): Promise<void> {
    await this.persist();
  }

  private send(ws: WebSocket, msg: unknown): void {
    ws.send(JSON.stringify(msg));
  }

  private sendError(ws: WebSocket, code: string, message: string): void {
    this.send(ws, { type: 'error', code, message });
  }

  private allSockets(): WebSocket[] {
    return this.ctx.getWebSockets();
  }

  private socketSeat(ws: WebSocket): Seat | null {
    const att = ws.deserializeAttachment() as WsAttachment | null;
    if (!att?.userId || !this.state) return null;
    return findHumanSeat(this.state, att.userId);
  }

  private sendState(ws: WebSocket): void {
    if (!this.state) return;
    const viewerSeat = this.socketSeat(ws);
    const filtered = this.state.currentHand
      ? filterHandStateForSeat(this.state.currentHand, viewerSeat)
      : null;
    this.send(ws, {
      type: 'state',
      state: {
        seats: this.state.seats.map((s) => ({
          seatNo: s.seatNo,
          occupiedBy: s.occupiedBy,
          stack: s.stack,
          sittingOut: s.sittingOut,
        })),
        handState: filtered ? handStateToWire(filtered) : null,
        yourSeat: viewerSeat,
      },
    });
  }

  private broadcastState(): void {
    for (const ws of this.allSockets()) this.sendState(ws);
  }

  private broadcastAction(seat: Seat, action: PlayerAction): void {
    const hand = this.state?.currentHand;
    if (!hand) return;
    for (const ws of this.allSockets()) {
      this.send(ws, {
        type: 'action',
        seatNo: seat,
        action: action.type,
        amount: 'amount' in action ? action.amount : 0,
        newPot: hand.pot,
        toAct: hand.toAct,
        deadline: 0,
      });
    }
  }

  private broadcastStreet(street: string, board: string[]): void {
    for (const ws of this.allSockets()) {
      this.send(ws, { type: 'street', street, board });
    }
  }

  private broadcastHandStart(): void {
    const hand = this.state?.currentHand;
    if (!hand) return;
    for (const ws of this.allSockets()) {
      const viewerSeat = this.socketSeat(ws);
      const player = viewerSeat !== null ? hand.players.get(viewerSeat) : null;
      this.send(ws, {
        type: 'hand_start',
        handId: hand.handId,
        button: hand.buttonSeat,
        sb: hand.sb,
        bb: hand.bb,
        yourCards: player ? player.holeCards : null,
      });
    }
  }

  private broadcastHandEnd(hand: HandState, winners: WinAllocation[]): void {
    // ショウダウン判定: 非 folded プレイヤーが 2 人以上いる場合のみカード公開。
    // 仕様 F-G-09: フォールド勝ちはカード非公開がデフォルト (Show/Muck は v2)。
    const nonFolded: Array<{ seat: Seat; cards: [string, string] }> = [];
    for (const [seat, player] of hand.players) {
      if (player.status !== 'folded') {
        nonFolded.push({ seat, cards: player.holeCards });
      }
    }
    const isShowdown = nonFolded.length >= 2;
    const showdown = isShowdown
      ? nonFolded.map((p) => ({ seatNo: p.seat, cards: p.cards, handRank: 'unknown' }))
      : [];

    for (const ws of this.allSockets()) {
      const viewerSeat = this.socketSeat(ws);
      // 観戦者/他席はショウダウン以外なら他人のホールカードを見れない (§12.3)。
      // 自席のカードは sendState / broadcastHandStart で既に送信済みなので、ここでは送らない。
      const viewerShowdown = isShowdown
        ? showdown
        : nonFolded
            .filter((p) => p.seat === viewerSeat)
            .map((p) => ({ seatNo: p.seat, cards: p.cards, handRank: 'unknown' }));
      this.send(ws, {
        type: 'hand_end',
        winners: winners.map((w) => ({ seatNo: w.seat, amount: w.amount })),
        showdown: viewerShowdown,
        analysis: { actions: [] },
      });
    }
  }
}
