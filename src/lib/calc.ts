import type { UsageState } from './pricing';

/**
 * Returns the "queries moved %" (0–100) that would produce `newValue` when lerping
 * from original to optimized for the given field.
 */
export function impliedPct(
  original: UsageState,
  optimized: UsageState,
  field: 'onDemandTiB' | 'standardSlotHours' | 'enterpriseSlotHours',
  newValue: number
): number {
  const orig = original[field];
  const opt = optimized[field];
  if (opt === orig) return 100;
  const t = (newValue - orig) / (opt - orig);
  return Math.min(100, Math.max(0, t * 100));
}

export function clampToRange(
  value: number,
  orig: number,
  opt: number
): { value: number; pct: number } {
  const min = Math.min(orig, opt);
  const max = Math.max(orig, opt);
  if (value <= min) return { value: min, pct: orig <= opt ? 0 : 100 };
  if (value >= max) return { value: max, pct: orig <= opt ? 100 : 0 };
  return { value, pct: -1 };
}

export function lerpUsage(from: UsageState, to: UsageState, t: number): UsageState {
  return {
    onDemandTiB: from.onDemandTiB + (to.onDemandTiB - from.onDemandTiB) * t,
    enterpriseSlotHours: from.enterpriseSlotHours + (to.enterpriseSlotHours - from.enterpriseSlotHours) * t,
    standardSlotHours: from.standardSlotHours + (to.standardSlotHours - from.standardSlotHours) * t,
  };
}
