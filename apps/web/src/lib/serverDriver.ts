import { type PlayerAction, type WinAllocation, handStateFromWire } from '@pokergo/engine';
import type { Seat, ServerMessage } from '@pokergo/shared';
import { useTableStore } from '../stores/tableStore';
import { PokergoSocket, type SocketStatus } from './socket';

const TABLE_ID = 'main';

// ServerMessage → tableStore 反映を一手に引き受けるドライバ。
// ローカルモードの handDriver と同様、submitAction を公開する。
class ServerDriver {
  private socket: PokergoSocket;
  private off: Array<() => void> = [];
  private connected = false;

  constructor() {
    this.socket = new PokergoSocket(TABLE_ID);
  }

  async connect(): Promise<void> {
    if (this.connected) return;
    this.connected = true;
    useTableStore.setState({ mode: 'server' });
    this.off.push(this.socket.onMessage((m) => this.handleMessage(m)));
    this.off.push(this.socket.onStatus((s) => this.handleStatus(s)));
    await this.socket.connect();
  }

  disconnect(): void {
    this.connected = false;
    this.socket.disconnect();
    for (const fn of this.off) fn();
    this.off = [];
    useTableStore.getState().setActionDeadline(null, 0);
  }

  submitAction(action: PlayerAction): void {
    if ('amount' in action) {
      this.socket.send({ type: 'action', action: action.type, amount: action.amount });
    } else {
      this.socket.send({ type: 'action', action: action.type });
    }
  }

  sit(seatNo: Seat): void {
    this.socket.send({ type: 'sit', seatNo });
  }

  leave(): void {
    this.socket.send({ type: 'leave' });
  }

  private handleStatus(s: SocketStatus): void {
    useTableStore.setState({ connection: s });
    if (s !== 'connected') {
      useTableStore.getState().setActionDeadline(null, 0);
    }
  }

  private handleMessage(msg: ServerMessage): void {
    const store = useTableStore.getState();
    switch (msg.type) {
      case 'state': {
        const snap = msg.state;
        const cpuNames = new Map<Seat, string>();
        for (const s of snap.seats) {
          if (s.occupiedBy?.type === 'cpu') {
            cpuNames.set(s.seatNo, s.occupiedBy.name);
          } else if (s.occupiedBy?.type === 'human') {
            cpuNames.set(s.seatNo, s.occupiedBy.handle);
          }
        }
        store.setCpuNames(cpuNames);
        store.setYourSeat((snap.yourSeat ?? 0) as Seat);
        if (snap.handState) {
          const hs = handStateFromWire(snap.handState);
          // サーバが持っている各 seat の stack を反映するため、TableSeat と HandPlayer を統合
          for (const seatRow of snap.seats) {
            if (!hs.players.has(seatRow.seatNo as Seat)) continue;
            const p = hs.players.get(seatRow.seatNo as Seat);
            if (p) {
              // hand 中はスタックは hand 内 stack を尊重（ベット分が差し引かれている）
            }
          }
          store.setState(hs);
        } else {
          store.setState(null);
        }
        break;
      }
      case 'action': {
        const cur = store.state;
        if (!cur) return;
        // 簡易反映: pot/toAct を更新し、該当 seat の currentBet/contribution を概算更新
        const next = structuredClone(cur);
        next.pot = msg.newPot;
        next.toAct = msg.toAct;
        const p = next.players.get(msg.seatNo);
        if (p) {
          if (msg.action === 'fold') p.status = 'folded';
          if (msg.action === 'all_in') p.status = 'allin';
          if (
            msg.action === 'call' ||
            msg.action === 'bet' ||
            msg.action === 'raise' ||
            msg.action === 'all_in'
          ) {
            p.currentBet += msg.amount;
            p.contribution += msg.amount;
            p.stack = Math.max(0, p.stack - msg.amount);
          }
        }
        store.setState(next);
        break;
      }
      case 'street': {
        const cur = store.state;
        if (!cur) return;
        const next = structuredClone(cur);
        next.street = msg.street;
        next.board = msg.board;
        next.currentBet = 0;
        for (const p of next.players.values()) p.currentBet = 0;
        store.setState(next);
        break;
      }
      case 'hand_start': {
        // サーバが直後に state を送るのでここではログのみ
        store.setShowdown(null, false);
        store.setStatus('playing');
        break;
      }
      case 'hand_end': {
        const winners: WinAllocation[] = msg.winners.map((w) => ({
          seat: w.seatNo,
          amount: w.amount,
          potLabel: 'pot',
        }));
        store.setShowdown(winners, true);
        store.setStatus('between_hands');
        store.incrementHandsPlayed();
        break;
      }
      case 'error':
        console.warn(`server error: ${msg.code} ${msg.message}`);
        break;
    }
  }
}

export const serverDriver = new ServerDriver();
