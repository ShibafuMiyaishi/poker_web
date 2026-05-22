// CPU の個性パラメータ。仕様 §9.4。
export interface CpuProfile {
  name: string;
  aggressiveness: number; // 1.0 を基準にベットサイズや value 閾値を増減
  bluffFreq: number; // 0.0-0.3、check の代わりに小ブラフを打つ確率
  callThresholdEquity: number; // medium hand を call と判定する下限 equity
}

export const CPU_PROFILES = {
  Alpha: { name: 'Alpha', aggressiveness: 1.1, bluffFreq: 0.15, callThresholdEquity: 0.45 },
  Bravo: { name: 'Bravo', aggressiveness: 1.0, bluffFreq: 0.1, callThresholdEquity: 0.48 },
  Charlie: { name: 'Charlie', aggressiveness: 0.9, bluffFreq: 0.08, callThresholdEquity: 0.5 },
  Delta: { name: 'Delta', aggressiveness: 1.05, bluffFreq: 0.12, callThresholdEquity: 0.46 },
  Echo: { name: 'Echo', aggressiveness: 1.15, bluffFreq: 0.18, callThresholdEquity: 0.42 },
} as const satisfies Record<string, CpuProfile>;

export type CpuName = keyof typeof CPU_PROFILES;
export const CPU_NAMES = Object.keys(CPU_PROFILES) as readonly CpuName[];
