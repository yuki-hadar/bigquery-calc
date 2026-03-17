import type { UsageState } from './pricing';

const DEFAULT_TIB_PER_SLOT_RATIO = 6.25 / 0.04; // standard 0.04; use getTibPerSlotRatio(config, edition) for edition-aware

/**
 * For scenario A (OD→Slots): slider is "remained %" for on-demand TiB.
 * remained OD = original.onDemandTiB * (pct/100); slots from optimized.
 */
export function effectiveDisplayedForScenarioA(
  original: UsageState,
  _optimized: UsageState,
  pct: number
): UsageState {
  const remainedOd = original.onDemandTiB * (pct / 100);
  return {
    onDemandTiB: remainedOd,
    standardSlotHours: _optimized.standardSlotHours,
    enterpriseSlotHours: _optimized.enterpriseSlotHours,
  };
}

/**
 * For scenario A: convert remained on-demand TiB back to slider pct.
 * pct = (remainedValue / original.onDemandTiB) * 100.
 */
export function remainedOdToPct(originalOnDemandTiB: number, remainedValue: number): number {
  if (originalOnDemandTiB <= 0) return 100;
  return Math.min(100, Math.max(0, (remainedValue / originalOnDemandTiB) * 100));
}

/**
 * For scenario B (Slots→OD): slider is "remained %" for slots.
 * Returns the effective displayed state: remained slots = originalSlots * (pct/100),
 * OD = (moved slots → TiB) + Yuki's on-demand TiB (optimized.onDemandTiB).
 * tibPerSlotRatio: slot-hours per TiB (from getTibPerSlotRatio(config, edition)); default standard 0.04.
 */
export function effectiveDisplayedForScenarioB(
  original: UsageState,
  optimized: UsageState,
  pct: number,
  tibPerSlotRatio: number = DEFAULT_TIB_PER_SLOT_RATIO
): UsageState {
  const originalSlots = original.standardSlotHours + original.enterpriseSlotHours;
  const remainedSlots = originalSlots * (pct / 100);
  const ratio = originalSlots > 0 ? remainedSlots / originalSlots : 1;
  const standardSlotHours = Math.round(original.standardSlotHours * ratio);
  const enterpriseSlotHours = Math.round(original.enterpriseSlotHours * ratio);
  const displayedSlots = standardSlotHours + enterpriseSlotHours;
  const movedSlots = originalSlots - displayedSlots;
  const addedOdTiBFromSlots = movedSlots / tibPerSlotRatio;
  const totalOnDemandTiB = original.onDemandTiB + addedOdTiBFromSlots + optimized.onDemandTiB;
  return {
    onDemandTiB: totalOnDemandTiB,
    standardSlotHours,
    enterpriseSlotHours,
  };
}

/**
 * For scenario B: convert remained slot-hours back to slider pct.
 * pct = (remainedValue / originalSlots) * 100.
 */
export function remainedSlotsToPct(originalSlots: number, remainedValue: number): number {
  if (originalSlots <= 0) return 100;
  return Math.min(100, Math.max(0, (remainedValue / originalSlots) * 100));
}

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
