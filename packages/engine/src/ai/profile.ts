// CPU の個性パラメータ。仕様 §9.4。
export interface CpuProfile {
  name: string;
  aggressiveness: number; // 1.0 を基準にベットサイズや value 閾値を増減
  bluffFreq: number; // 0.0-0.3、check の代わりに小ブラフを打つ確率
  callThresholdEquity: number; // medium hand を call と判定する下限 equity
}

// aggressiveness は 0.95-1.10 のレンジに収めて極端な行動を抑制。
// bluffFreq は半減（ポストフロップで wild な賭けを減らす）。
export const CPU_PROFILES = {
  Alpha: { name: 'Alpha', aggressiveness: 1.05, bluffFreq: 0.06, callThresholdEquity: 0.46 },
  Bravo: { name: 'Bravo', aggressiveness: 1.0, bluffFreq: 0.05, callThresholdEquity: 0.48 },
  Charlie: { name: 'Charlie', aggressiveness: 0.95, bluffFreq: 0.04, callThresholdEquity: 0.5 },
  Delta: { name: 'Delta', aggressiveness: 1.02, bluffFreq: 0.05, callThresholdEquity: 0.47 },
  Echo: { name: 'Echo', aggressiveness: 1.08, bluffFreq: 0.07, callThresholdEquity: 0.45 },
} as const satisfies Record<string, CpuProfile>;

export type CpuName = keyof typeof CPU_PROFILES;
export const CPU_NAMES = Object.keys(CPU_PROFILES) as readonly CpuName[];
