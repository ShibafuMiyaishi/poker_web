import type { Seat } from '@pokergo/shared';
import type { HandState } from '../game/types';

export type SeatOccupant =
  | { type: 'human'; userId: string; handle: string }
  | { type: 'cpu'; cpuId: string; name: string }
  | null;

export interface TableSeat {
  seatNo: Seat;
  occupiedBy: SeatOccupant;
  stack: number;
  sittingOut: boolean;
  lastActionAt: number;
}

// 仕様 §6.2 の TableState。Durable Object の state.storage に格納される。
export interface TableState {
  tableId: string;
  config: { sb: number; bb: number; maxSeats: 8 };
  seats: TableSeat[];
  currentHand: HandState | null;
  buttonSeat: Seat;
  handNo: number;
  spectators: Array<{ userId: string; handle: string }>;
}

const DEFAULT_BUY_IN = 1000;
const CPU_NAMES = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo'] as const;

export function createInitialTableState(tableId: string, sb: number, bb: number): TableState {
  const seats: TableSeat[] = [];
  for (let i = 0; i < 8; i++) {
    seats.push({
      seatNo: i as Seat,
      occupiedBy: null,
      stack: 0,
      sittingOut: false,
      lastActionAt: 0,
    });
  }
  return {
    tableId,
    config: { sb, bb, maxSeats: 8 },
    seats,
    currentHand: null,
    buttonSeat: 0 as Seat,
    handNo: 0,
    spectators: [],
  };
}

export interface SitDownRequest {
  seatNo: Seat;
  userId: string;
  handle: string;
}

export function sitDownHuman(state: TableState, req: SitDownRequest): TableState {
  const seats = state.seats.map((s) => {
    if (s.seatNo !== req.seatNo) return s;
    if (s.occupiedBy && s.occupiedBy.type === 'human' && s.occupiedBy.userId === req.userId) {
      return s; // 再 subscribe
    }
    if (s.occupiedBy) {
      throw new Error(`seat ${req.seatNo} occupied`);
    }
    return {
      ...s,
      occupiedBy: { type: 'human' as const, userId: req.userId, handle: req.handle },
      stack: DEFAULT_BUY_IN,
      sittingOut: false,
      lastActionAt: Date.now(),
    };
  });
  return { ...state, seats };
}

export function standUp(state: TableState, userId: string): TableState {
  const seats = state.seats.map((s) => {
    if (s.occupiedBy?.type === 'human' && s.occupiedBy.userId === userId) {
      return { ...s, occupiedBy: null, stack: 0, lastActionAt: Date.now() };
    }
    return s;
  });
  return { ...state, seats };
}

// 空き席を CPU で埋め、8 人卓を常時維持する（仕様 F-G-03）。
export function fillEmptySeatsWithCpu(state: TableState): TableState {
  let cpuIdx = 0;
  const seats = state.seats.map((s) => {
    if (s.occupiedBy) return s;
    const name = CPU_NAMES[cpuIdx % CPU_NAMES.length] as string;
    cpuIdx += 1;
    return {
      ...s,
      occupiedBy: { type: 'cpu' as const, cpuId: `cpu-${name}-${s.seatNo}`, name },
      stack: DEFAULT_BUY_IN,
      sittingOut: false,
      lastActionAt: Date.now(),
    };
  });
  return { ...state, seats };
}

export function findHumanSeat(state: TableState, userId: string): Seat | null {
  const found = state.seats.find(
    (s) => s.occupiedBy?.type === 'human' && s.occupiedBy.userId === userId,
  );
  return found ? found.seatNo : null;
}
