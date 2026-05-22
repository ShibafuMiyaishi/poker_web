import type { ClientMessage, ServerMessage } from '@pokergo/shared';
import { API_BASE, getStoredJwt, loginAsGuest } from './auth';

type MessageHandler = (msg: ServerMessage) => void;
type StatusHandler = (status: SocketStatus) => void;

export type SocketStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

const BACKOFF_BASE_MS = 800;
const BACKOFF_MAX_MS = 15000;

function toWsUrl(httpBase: string): string {
  if (httpBase.startsWith('https://')) return `wss://${httpBase.slice(8)}`;
  if (httpBase.startsWith('http://')) return `ws://${httpBase.slice(7)}`;
  return httpBase;
}

export class PokergoSocket {
  private tableId: string;
  private ws: WebSocket | null = null;
  private status: SocketStatus = 'idle';
  private messageHandlers = new Set<MessageHandler>();
  private statusHandlers = new Set<StatusHandler>();
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionalClose = false;
  private pingTimer: ReturnType<typeof setInterval> | null = null;

  constructor(tableId: string) {
    this.tableId = tableId;
  }

  onMessage(h: MessageHandler): () => void {
    this.messageHandlers.add(h);
    return () => this.messageHandlers.delete(h);
  }

  onStatus(h: StatusHandler): () => void {
    this.statusHandlers.add(h);
    h(this.status);
    return () => this.statusHandlers.delete(h);
  }

  async connect(): Promise<void> {
    if (this.ws && (this.status === 'connecting' || this.status === 'connected')) return;
    this.intentionalClose = false;
    let jwt = getStoredJwt();
    if (!jwt) {
      await loginAsGuest();
      jwt = getStoredJwt();
    }
    if (!jwt) {
      this.setStatus('error');
      return;
    }
    const wsBase = toWsUrl(API_BASE);
    const url = `${wsBase}/ws/table/${encodeURIComponent(this.tableId)}?token=${encodeURIComponent(jwt)}`;
    this.setStatus('connecting');
    const ws = new WebSocket(url);
    this.ws = ws;

    ws.addEventListener('open', () => {
      this.reconnectAttempt = 0;
      this.setStatus('connected');
      this.send({ type: 'subscribe' });
      this.startPing();
    });

    ws.addEventListener('message', (ev) => {
      let parsed: ServerMessage;
      try {
        parsed = JSON.parse(ev.data) as ServerMessage;
      } catch {
        return;
      }
      for (const h of this.messageHandlers) h(parsed);
    });

    ws.addEventListener('close', () => {
      this.ws = null;
      this.stopPing();
      if (this.intentionalClose) {
        this.setStatus('idle');
        return;
      }
      this.setStatus('disconnected');
      this.scheduleReconnect();
    });

    ws.addEventListener('error', () => {
      this.setStatus('error');
    });
  }

  send(msg: ClientMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  disconnect(): void {
    this.intentionalClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopPing();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus('idle');
  }

  private setStatus(s: SocketStatus): void {
    this.status = s;
    for (const h of this.statusHandlers) h(s);
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    const delay = Math.min(BACKOFF_BASE_MS * 2 ** this.reconnectAttempt, BACKOFF_MAX_MS);
    this.reconnectAttempt += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.connect();
    }, delay);
  }

  private startPing(): void {
    this.stopPing();
    this.pingTimer = setInterval(() => this.send({ type: 'ping' }), 25000);
  }

  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }
}
