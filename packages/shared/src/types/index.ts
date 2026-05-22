export type Card = string; // "Ah", "Kd", ... PokerStars 互換、10 は "T"
export type Seat = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type Position = 'BTN' | 'SB' | 'BB' | 'UTG' | 'UTG+1' | 'MP' | 'HJ' | 'CO';
export type Street = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
export type ActionType = 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all_in';
