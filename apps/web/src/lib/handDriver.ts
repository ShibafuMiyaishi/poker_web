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
  cryptoRng,
  decideAction,
  isHandOver,
  settleHand,
  startHand,
} from '@pokergo/engine';
import type { Seat } from '@pokergo/shared';
import { useTableStore } from '../stores/tableStore';
import { computeEquity } from './equityClient';

const STARTING_STACK = 1000;
const SB = 5;
const BB = 10;
const SEATS = 8;
const CPU_THINK_MIN_MS = 700;
const CPU_THINK_MAX_MS = 2000;
const SHOWDOWN_HOLD_MS = 3500;

class HandDriver {
  private rng: Rng = cryptoRng;
  private stacks = new Map<Seat, number>();
  private cpuBySeat = new Map<Seat, CpuName>();
  private yourSeat: Seat = 0 as Seat;
  private buttonSeat: Seat = 1 as Seat;

  constructor() {
    for (let i = 0; i < SEATS; i++) this.stacks.set(i as Seat, STARTING_STACK);
    // seat 0 = human、それ以外 5 体（CPU_NAMES）+ 2 体は同じ CPU 名を循環使用
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
    const cur = useTableStore.getState().state;
    if (!cur || cur.toAct !== this.yourSeat) return;
    const next = applyAction(cur, action);
    useTableStore.getState().setState(next);
    await this.runUntilHuman(next);
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
        return; // 待機: ユーザー入力
      }
      // CPU 番
      const cpuName = this.cpuBySeat.get(state.toAct);
      const profile = cpuName ? CPU_PROFILES[cpuName] : CPU_PROFILES.Bravo;
      await delay(CPU_THINK_MIN_MS + Math.random() * (CPU_THINK_MAX_MS - CPU_THINK_MIN_MS));
      const action = decideAction(state, state.toAct, profile, this.rng);
      state = applyAction(state, action);
      useTableStore.getState().setState(state);
    }
    // showdown まで進める
    while (state.street !== 'showdown') {
      state = advanceStreet(state);
      useTableStore.getState().setState(state);
    }
    await this.finishHand(state);
  }

  private async finishHand(state: HandState): Promise<void> {
    // スタック更新
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

    // 分析を Web Worker で計算してストアへ
    analyzeHand(state, this.yourSeat, (hero, board) => computeEquity(hero, board, 10000))
      .then((a) => useTableStore.getState().setAnalysis(a))
      .catch(() => useTableStore.getState().setAnalysis(null));

    // ボタン移動
    for (let i = 1; i <= SEATS; i++) {
      const cand = ((this.buttonSeat + i) % SEATS) as Seat;
      if ((this.stacks.get(cand) ?? 0) >= BB) {
        this.buttonSeat = cand;
        break;
      }
    }

    await delay(SHOWDOWN_HOLD_MS);
    useTableStore.getState().setAnalysis(null);
    this.startNewHand();
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const handDriver = new HandDriver();
