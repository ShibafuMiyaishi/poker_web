import type { HandAnalysis, HandPayload } from '@pokergo/engine';
import { API_BASE, getStoredJwt, loginAsGuest } from './auth';

interface RequestOpts {
  method?: string;
  body?: unknown;
}

const PENDING_QUEUE_KEY = 'pokergo_pending_hands';

function buildInit(opts: RequestOpts, headers: Record<string, string>): RequestInit {
  const init: RequestInit = { method: opts.method ?? 'GET', headers };
  if (opts.body !== undefined) init.body = JSON.stringify(opts.body);
  return init;
}

async function apiFetch<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  let jwt = getStoredJwt();
  if (!jwt) {
    await loginAsGuest();
    jwt = getStoredJwt();
  }
  const headers: Record<string, string> = {
    Authorization: `Bearer ${jwt}`,
    'content-type': 'application/json',
  };
  const res = await fetch(`${API_BASE}${path}`, buildInit(opts, headers));
  if (res.status === 401) {
    await loginAsGuest();
    const retryJwt = getStoredJwt();
    const retry = await fetch(
      `${API_BASE}${path}`,
      buildInit(opts, { ...headers, Authorization: `Bearer ${retryJwt}` }),
    );
    if (!retry.ok) throw new Error(`api ${path}: ${retry.status}`);
    return (await retry.json()) as T;
  }
  if (!res.ok) throw new Error(`api ${path}: ${res.status}`);
  return (await res.json()) as T;
}

export async function postHand(payload: HandPayload): Promise<void> {
  await apiFetch('/api/hands', { method: 'POST', body: payload });
}

export async function postAnalysis(handId: string, analysis: HandAnalysis): Promise<void> {
  await apiFetch(`/api/hands/${encodeURIComponent(handId)}/analysis`, {
    method: 'POST',
    body: analysis,
  });
}

export interface HandListItem {
  id: string;
  started_at: number;
  ended_at: number;
  sb: number;
  bb: number;
  button_seat: number;
  board: string;
  pot_total: number;
  seat_no: number;
  position: string;
  hole_cards: string;
  net_chips: number;
  won: number;
}

export interface HandDetail {
  hand: {
    id: string;
    table_id: string;
    started_at: number;
    sb: number;
    bb: number;
    button_seat: number;
    board: string;
    pot_total: number;
    pokerstars_text: string;
  };
  players: Array<{
    user_id: string | null;
    cpu_name: string | null;
    seat_no: number;
    position: string;
    hole_cards: string;
    net_chips: number;
    won: number;
  }>;
  actions: Array<{
    street: string;
    seat_no: number;
    order_no: number;
    action_type: string;
    amount: number;
    pot_before: number;
  }>;
}

export async function listHands(limit = 20, offset = 0): Promise<{ hands: HandListItem[] }> {
  return apiFetch(`/api/history/hands?limit=${limit}&offset=${offset}`);
}

export async function getHand(id: string): Promise<HandDetail> {
  return apiFetch(`/api/history/hands/${encodeURIComponent(id)}`);
}

export type Period = 'all' | 'month' | 'week';

export interface StatsSummary {
  period: Period;
  handsPlayed: number;
  totalNetChips: number;
  bbPer100: number;
  evBbPer100: number;
  totalDeviationBb: number;
  vpip: number;
  pfr: number;
  threeBetPct: number;
  af: number;
  wtsd: number;
  wDollarSd: number;
  detail: {
    vpipHands: number;
    pfrHands: number;
    threeBetOpportunities: number;
    threeBetHands: number;
    sawFlopHands: number;
    showdownHands: number;
    winsAtShowdown: number;
    postflopAggressive: number;
    postflopCalls: number;
  };
}

export interface GraphPoint {
  handNo: number;
  startedAt: number;
  cumulativeNetChips: number;
  cumulativeNetBb: number;
  cumulativeEvBb: number;
}

export async function getStats(period: Period = 'all'): Promise<StatsSummary> {
  return apiFetch(`/api/history/stats?period=${period}`);
}

export async function getGraph(period: Period = 'all'): Promise<{ points: GraphPoint[] }> {
  return apiFetch(`/api/history/graph?period=${period}`);
}

function loadPendingQueue(): HandPayload[] {
  const s = localStorage.getItem(PENDING_QUEUE_KEY);
  if (!s) return [];
  try {
    return JSON.parse(s) as HandPayload[];
  } catch {
    return [];
  }
}

function savePendingQueue(q: HandPayload[]): void {
  localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(q));
}

export async function postHandWithQueue(payload: HandPayload): Promise<void> {
  try {
    await postHand(payload);
  } catch {
    const q = loadPendingQueue();
    q.push(payload);
    savePendingQueue(q);
  }
}

export async function flushPendingQueue(): Promise<void> {
  const q = loadPendingQueue();
  if (q.length === 0) return;
  const remaining: HandPayload[] = [];
  for (const p of q) {
    try {
      await postHand(p);
    } catch {
      remaining.push(p);
    }
  }
  savePendingQueue(remaining);
}
