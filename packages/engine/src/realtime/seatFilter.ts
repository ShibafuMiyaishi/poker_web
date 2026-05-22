import type { Card, Seat } from '@pokergo/shared';
import type { HandPlayer, HandState } from '../game/types';

// 他席のホールカードを伏せるためのプレースホルダ表記
export const HIDDEN_CARD: Card = '??';
const HIDDEN_PAIR: [Card, Card] = [HIDDEN_CARD, HIDDEN_CARD];

// viewerSeat が見える形に HandState を変換する。
//   - 自席のホールカードは表示
//   - 他席はショウダウン中で fold していない場合のみ表示、それ以外は伏せる
//   - deck はクライアントへは絶対送らない
export function filterHandStateForSeat(state: HandState, viewerSeat: Seat | null): HandState {
  const isShowdown = state.street === 'showdown';
  const players = new Map<Seat, HandPlayer>();
  for (const [seat, player] of state.players) {
    const showCards = seat === viewerSeat || (isShowdown && player.status !== 'folded');
    players.set(seat, {
      ...player,
      holeCards: showCards ? player.holeCards : HIDDEN_PAIR,
    });
  }
  return {
    ...state,
    players,
    deck: [],
  };
}
