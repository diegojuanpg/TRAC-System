// sRPE color tiers (Foster session-RPE).
// Calibrated for sessions 60-180 min typical.

export interface SrpeTier {
  max: number;
  hue: number;
  label: string;
}

export const SRPE_TIERS: SrpeTier[] = [
  { max: 1,    hue: 0,   label: 'Descanso' },   // 0 only
  { max: 300,  hue: 140, label: 'Recuperativa' },
  { max: 600,  hue: 120, label: 'Ligera-Moderada' },
  { max: 900,  hue: 48,  label: 'Moderada-Alta' },
  { max: 1200, hue: 28,  label: 'Alta' },
  { max: Infinity, hue: 0, label: 'Extrema' },
];

export function srpeColor(srpe: number): string {
  if (srpe <= 0) return 'hsl(0, 0%, 45%)';
  if (srpe < 300)  return 'hsl(140, 55%, 60%)';
  if (srpe < 600)  return 'hsl(120, 55%, 50%)';
  if (srpe < 900)  return 'hsl(48,  80%, 55%)';
  if (srpe < 1200) return 'hsl(28,  85%, 55%)';
  return 'hsl(0, 75%, 55%)';
}

export function srpeLabel(srpe: number): string {
  if (srpe <= 0) return 'Descanso';
  if (srpe < 300)  return 'Recuperativa';
  if (srpe < 600)  return 'Ligera-Moderada';
  if (srpe < 900)  return 'Moderada-Alta';
  if (srpe < 1200) return 'Alta';
  return 'Extrema';
}

export function computeSrpe(rpe: number, duration: number): number {
  return Math.round(rpe * duration);
}
