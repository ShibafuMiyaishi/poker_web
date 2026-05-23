import {
  CPU_NAMES,
  CPU_PROFILES,
  type CpuName,
  type HandState,
  type PlayerAction,
  type Rng,
  advanceStreet,
  analyzeHand,
  applyAction,
  buildHandPayload,
  cryptoRng,
  decideAction,
  isHandOver,
  settleHand,
  startHand,
  toPokerStarsText,
} from '@pokergo/engine';
import type { Seat } from '@pokergo/shared';
import { useTableStore } from '../stores/tableStore';
import { postAnalysis, postHandWithQueue } from './api';
import { getStoredUser } from './auth';
import { computeEquity } from './equityClient';

const STARTING_STACK = 1000;
const SB = 5;
const BB = 10;
const SEATS = 8;
const CPU_THINK_MIN_MS = 600;
const CPU_THINK_MAX_MS = 1600;
const SHOWDOWN_HOLD_MS = 2200; // 3500 → 2200ms に短縮
const HUMAN_TIMEOUT_MS = 10000;

class HandDriver {
  private rng: Rng = cryptoRng;
  private stacks = new Map<Seat, number>();
  private cpuBySeat = new Map<Seat, CpuName>();
  private yourSeat: Seat = 0 as Seat;
  private buttonSeat: Seat = 1 as Seat;
  private humanTimer: ReturnType<typeof setTimeout> | null = null;
  // ハンド間の待機タイマー。skipToNextHand で即座に消化する。
  private interHandTimer: ReturnType<typeof setTimeout> | null = null;
  private interHandResolve: (() => void) | null = null;

  constructor() {
    for (let i = 0; i < SEATS; i++) this.stacks.set(i as Seat, STARTING_STACK);
    for (let i = 1; i < SEATS; i++) {
      const cpu = CPU_NAMES[(i - 1) % CPU_NAMES.length] as CpuName;
      this.cpuBySeat.set(i as Seat, cpu);
    }
    useTableStore.setState({
      yourSeat: this.yourSeat,
      cpuNames: new Map(
        [...this.cpuBySeat.entries()].map(([seat, name]) => [seat, name as string]),
      ),
    });
  }

  startNewHand(): void {
    this.clearHumanTimer();
    const participants: { seat: Seat; stack: number }[] = [];
    for (let i = 0; i < SEATS; i++) {
      const stack = this.stacks.get(i as Seat) ?? 0;
      if (stack >= BB) participants.push({ seat: i as Seat, stack });
    }
    if (participants.length < 2) {
      useTableStore.getState().setStatus('idle');
      return;
    }
    if (!participants.some((p) => p.seat === this.buttonSeat)) {
      this.buttonSeat = participants[0]?.seat ?? (0 as Seat);
    }

    const state = startHand({
      handId: `local-${useTableStore.getState().handsPlayed + 1}`,
      participants,
      buttonSeat: this.buttonSeat,
      sb: SB,
      bb: BB,
    });

    useTableStore.getState().setState(state);
    useTableStore.getState().setShowdown(null, false);
    useTableStore.getState().setStatus('playing');

    void this.runUntilHuman(state);
  }

  async submitHumanAction(action: PlayerAction): Promise<void> {
    this.clearHumanTimer();
    const cur = useTableStore.getState().state;
    if (!cur || cur.toAct !== this.yourSeat) return;
    const next = applyAction(cur, action);
    useTableStore.getState().setState(next);
    await this.runUntilHuman(next);
  }

  private clearHumanTimer(): void {
    if (this.humanTimer) {
      clearTimeout(this.humanTimer);
      this.humanTimer = null;
    }
    useTableStore.getState().setActionDeadline(null, 0);
  }

  private armHumanTimer(): void {
    this.clearHumanTimer();
    const deadline = Date.now() + HUMAN_TIMEOUT_MS;
    useTableStore.getState().setActionDeadline(deadline, HUMAN_TIMEOUT_MS);
    this.humanTimer = setTimeout(() => this.autoActHuman(), HUMAN_TIMEOUT_MS);
  }

  // 仕様 §8.2 タイムアウト: 賭けるべき額 0 → check、それ以外 → fold
  private autoActHuman(): void {
    const state = useTableStore.getState().state;
    if (!state || state.toAct !== this.yourSeat) return;
    const player = state.players.get(this.yourSeat);
    if (!player) return;
    const action: PlayerAction =
      player.currentBet === state.currentBet
        ? { seat: this.yourSeat, type: 'check' }
        : { seat: this.yourSeat, type: 'fold' };
    void this.submitHumanAction(action);
  }

  private async runUntilHuman(initial: HandState): Promise<void> {
    let state = initial;
    while (!isHandOver(state)) {
      if (state.toAct === null) {
        state = advanceStreet(state);
        useTableStore.getState().setState(state);
        continue;
      }
      if (state.toAct === this.yourSeat) {
        this.armHumanTimer();
        return; // 待機: ユーザー入力 or タイムアウト
      }
      // CPU 番
      const cpuName = this.cpuBySeat.get(state.toAct);
      const profile = cpuName ? CPU_PROFILES[cpuName] : CPU_PROFILES.Bravo;
      await delay(CPU_THINK_MIN_MS + Math.random() * (CPU_THINK_MAX_MS - CPU_THINK_MIN_MS));
      const action = decideAction(state, state.toAct, profile, this.rng);
      state = applyAction(state, action);
      useTableStore.getState().setState(state);
    }
    while (state.street !== 'showdown') {
      state = advanceStreet(state);
      useTableStore.getState().setState(state);
    }
    await this.finishHand(state);
  }

  private async finishHand(state: HandState): Promise<void> {
    this.clearHumanTimer();
    for (const p of state.players.values()) {
      this.stacks.set(p.seat, p.stack);
    }
    const winners = settleHand(state);
    for (const w of winners) {
      this.stacks.set(w.seat, (this.stacks.get(w.seat) ?? 0) + w.amount);
    }
    useTableStore.getState().setShowdown(winners, true);
    useTableStore.getState().setStatus('between_hands');
    useTableStore.getState().incrementHandsPlayed();

    // D1 への永続化 (Phase 2)。失敗時はキューにためて次回再送。
    const handsPlayed = useTableStore.getState().handsPlayed;
    const cpuNames = useTableStore.getState().cpuNames;
    const user = getStoredUser();
    const pokerstarsText = toPokerStarsText(state, winners, {
      tableName: 'Pokergo Main',
      handNumber: state.handId,
      startedAt: new Date(),
      seatLabel: (seat) =>
        seat === this.yourSeat ? (user?.handle ?? 'You') : (cpuNames.get(seat) ?? `Seat${seat}`),
      yourSeat: this.yourSeat,
    });
    const payload = buildHandPayload(state, {
      tableId: 'main',
      handNo: handsPlayed,
      startedAt: Date.now() - 10000,
      endedAt: Date.now(),
      pokerstarsText,
      seatLabel: (seat) => {
        const cpuName = cpuNames.get(seat);
        if (seat === this.yourSeat) {
          return { userId: user?.id ?? null, cpuName: null, position: '' };
        }
        return { userId: null, cpuName: cpuName ?? `Seat${seat}`, position: '' };
      },
      winners,
    });
    void postHandWithQueue(payload);

    // 分析を Web Worker で計算 → ストアへ反映 → D1 actions 行にも書き戻す
    analyzeHand(state, this.yourSeat, (hero, board, numOpp) =>
      computeEquity(hero, board, 10000, numOpp),
    )
      .then(async (a) => {
        useTableStore.getState().setAnalysis(a);
        try {
          await postAnalysis(state.handId, a);
        } catch {
          // ネットワーク不通時はサイレント失敗
        }
      })
      .catch(() => useTableStore.getState().setAnalysis(null));

    // ボタン移動
    for (let i = 1; i <= SEATS; i++) {
      const cand = ((this.buttonSeat + i) % SEATS) as Seat;
      if ((this.stacks.get(cand) ?? 0) >= BB) {
        this.buttonSeat = cand;
        break;
      }
    }

    await this.waitBetweenHands();
    useTableStore.getState().setAnalysis(null);
    this.startNewHand();
  }

  // skipToNextHand で即解除可能なハンド間待機。
  private waitBetweenHands(): Promise<void> {
    return new Promise((resolve) => {
      this.interHandResolve = resolve;
      this.interHandTimer = setTimeout(() => {
        this.interHandTimer = null;
        this.interHandResolve = null;
        resolve();
      }, SHOWDOWN_HOLD_MS);
    });
  }

  // ファストフォールド/早送り用。ハンド終了画面を即スキップして次ハンドへ。
  skipToNextHand(): void {
    if (this.interHandTimer) {
      clearTimeout(this.interHandTimer);
      this.interHandTimer = null;
    }
    if (this.interHandResolve) {
      this.interHandResolve();
      this.interHandResolve = null;
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const handDriver = new HandDriver();
