import type { WireActionEntry, WireHandPlayer, WireHandState } from '@pokergo/shared';
import type { ActionEntry, HandPlayer, HandState } from '../game/types';

// JSON.stringify 経路では Map と deck が消えるので、ワイヤ用に変換する。
export function handStateToWire(state: HandState): WireHandState {
  const players: Array<[number, WireHandPlayer]> = [];
  for (const [seat, p] of state.players) {
    players.push([
      seat,
      {
        seat: p.seat,
        startStack: p.startStack,
        stack: p.stack,
        holeCards: p.holeCards,
        status: p.status,
        contribution: p.contribution,
        currentBet: p.currentBet,
        hasActedSinceLastRaise: p.hasActedSinceLastRaise,
      },
    ]);
  }
  const actions: WireActionEntry[] = state.actions.map((a: ActionEntry) => ({
    seat: a.seat,
    street: a.street,
    type: a.type,
    amount: a.amount,
    potBefore: a.potBefore,
    toCallBefore: a.toCallBefore,
  }));
  return {
    handId: state.handId,
    street: state.street,
    board: state.board,
    players: players as WireHandState['players'],
    buttonSeat: state.buttonSeat,
    sb: state.sb,
    bb: state.bb,
    pot: state.pot,
    currentBet: state.currentBet,
    minRaise: state.minRaise,
    lastRaiser: state.lastRaiser,
    toAct: state.toAct,
    actions,
  };
}

export function handStateFromWire(wire: WireHandState): HandState {
  const players = new Map<HandPlayer['seat'], HandPlayer>();
  for (const [seat, p] of wire.players) {
    players.set(seat as HandPlayer['seat'], {
      seat: p.seat,
      startStack: p.startStack,
      stack: p.stack,
      holeCards: p.holeCards,
      status: p.status,
      contribution: p.contribution,
      currentBet: p.currentBet,
      hasActedSinceLastRaise: p.hasActedSinceLastRaise,
    });
  }
  const actions: ActionEntry[] = wire.actions.map((a) => ({
    seat: a.seat,
    street: a.street,
    type: a.type,
    amount: a.amount,
    potBefore: a.potBefore,
    toCallBefore: a.toCallBefore,
  }));
  return {
    handId: wire.handId,
    street: wire.street,
    board: wire.board,
    players,
    buttonSeat: wire.buttonSeat,
    sb: wire.sb,
    bb: wire.bb,
    pot: wire.pot,
    currentBet: wire.currentBet,
    minRaise: wire.minRaise,
    lastRaiser: wire.lastRaiser,
    toAct: wire.toAct,
    deck: [],
    actions,
  };
}
