import {
  type HandPayload,
  type HandState,
  type PlayerAction,
  type TableState,
  type WinAllocation,
  advanceUntilHumanOrEnd,
  applyHumanAction,
  buildHandPayload,
  createInitialTableState,
  fillEmptySeatsWithCpu,
  filterHandStateForSeat,
  findHumanSeat,
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

const STORAGE_KEY = 'tableState';
const DEFAULT_TABLE_ID = 'main';
const NEXT_HAND_DELAY_MS = 2500;

interface WsAttachment {
  userId: string;
  handle: string;
  subscribed: boolean;
}

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
  private nextHandTimer: ReturnType<typeof setTimeout> | null = null;

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
    const secret = this.env.JWT_SECRET ?? 'dev-only-insecure-secret';
    const payload = await verifyJwt(token, secret);
    if (!payload) return new Response('invalid token', { status: 401 });

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair) as [WebSocket, WebSocket];
    this.ctx.acceptWebSocket(server);
    const attach: WsAttachment = {
      userId: payload.sub,
      handle: payload.handle,
      subscribed: false,
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
    await this.persist();
    await this.continueHand();
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
    await this.continueHand();
  }

  private async continueHand(): Promise<void> {
    if (!this.state || !this.state.currentHand) return;
    const r = advanceUntilHumanOrEnd(this.state);
    this.state = r.state;
    for (const ev of r.events) {
      if (ev.type === 'street_advanced') {
        this.broadcastStreet(ev.street, ev.board);
      } else {
        this.broadcastAction(ev.seat, ev.action);
      }
    }
    await this.persist();

    const cur = this.state.currentHand;
    if (cur && (cur.street === 'showdown' || isHandOver(cur))) {
      await this.finishHand();
    }
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
    this.scheduleNextHand();
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

  private scheduleNextHand(): void {
    if (this.nextHandTimer !== null) clearTimeout(this.nextHandTimer);
    this.nextHandTimer = setTimeout(() => {
      this.nextHandTimer = null;
      void this.maybeStartHand();
    }, NEXT_HAND_DELAY_MS);
  }

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
        handState: filtered
          ? {
              handId: filtered.handId,
              street: filtered.street,
              board: filtered.board,
              pot: filtered.pot,
              currentBet: filtered.currentBet,
              toAct: filtered.toAct,
              deadline: 0,
            }
          : null,
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
    const showdown: Array<{ seatNo: Seat; cards: [string, string]; handRank: string }> = [];
    for (const [seat, player] of hand.players) {
      if (player.status !== 'folded') {
        showdown.push({ seatNo: seat, cards: player.holeCards, handRank: 'unknown' });
      }
    }
    for (const ws of this.allSockets()) {
      this.send(ws, {
        type: 'hand_end',
        winners: winners.map((w) => ({ seatNo: w.seat, amount: w.amount })),
        showdown,
        analysis: { actions: [] },
      });
    }
  }
}
