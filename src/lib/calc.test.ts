import { describe, it, expect } from 'vitest';
import { impliedPct, clampToRange, lerpUsage } from './calc';
import type { UsageState } from './pricing';

describe('lerpUsage', () => {
  it('at t=0 returns original state', () => {
    const from: UsageState = { onDemandTiB: 16000, enterpriseSlotHours: 0, standardSlotHours: 0 };
    const to: UsageState = { onDemandTiB: 8000, enterpriseSlotHours: 0, standardSlotHours: 250000 };
    const result = lerpUsage(from, to, 0);
    expect(result.onDemandTiB).toBe(16000);
    expect(result.standardSlotHours).toBe(0);
  });

  it('at t=1 returns optimized state', () => {
    const from: UsageState = { onDemandTiB: 16000, enterpriseSlotHours: 0, standardSlotHours: 0 };
    const to: UsageState = { onDemandTiB: 8000, enterpriseSlotHours: 0, standardSlotHours: 250000 };
    const result = lerpUsage(from, to, 1);
    expect(result.onDemandTiB).toBe(8000);
    expect(result.standardSlotHours).toBe(250000);
  });

  it('at t=0.6 (default 60% moved) gives correct remained on-demand for scenario A', () => {
    const original: UsageState = { onDemandTiB: 16000, enterpriseSlotHours: 0, standardSlotHours: 0 };
    const optimized: UsageState = { onDemandTiB: 8000, enterpriseSlotHours: 0, standardSlotHours: 250000 };
    const displayed = lerpUsage(original, optimized, 0.6);
    // 16000 + (8000 - 16000) * 0.6 = 16000 - 4800 = 11200
    expect(displayed.onDemandTiB).toBe(11200);
  });
});

describe('impliedPct', () => {
  it('scenario A default: original 16000, optimized 8000, value 11200 -> 60% moved', () => {
    const original: UsageState = { onDemandTiB: 16000, enterpriseSlotHours: 0, standardSlotHours: 0 };
    const optimized: UsageState = { onDemandTiB: 8000, enterpriseSlotHours: 0, standardSlotHours: 250000 };
    const pct = impliedPct(original, optimized, 'onDemandTiB', 11200);
    expect(pct).toBe(60);
  });

  it('scenario A: original 41002, optimized 8000, remained 18919 -> ~67% moved', () => {
    const original: UsageState = { onDemandTiB: 41002, enterpriseSlotHours: 0, standardSlotHours: 0 };
    const optimized: UsageState = { onDemandTiB: 8000, enterpriseSlotHours: 0, standardSlotHours: 250000 };
    const pct = impliedPct(original, optimized, 'onDemandTiB', 18919);
    // t = (18919 - 41002) / (8000 - 41002) = -22083 / -33002 ≈ 0.6692 -> 66.92%
    expect(pct).toBeGreaterThanOrEqual(66);
    expect(pct).toBeLessThanOrEqual(68);
  });

  it('round-trip: impliedPct then lerp gives back the value', () => {
    const original: UsageState = { onDemandTiB: 41002, enterpriseSlotHours: 0, standardSlotHours: 0 };
    const optimized: UsageState = { onDemandTiB: 8000, enterpriseSlotHours: 0, standardSlotHours: 250000 };
    const remained = 18919;
    const pct = impliedPct(original, optimized, 'onDemandTiB', remained);
    const displayed = lerpUsage(original, optimized, pct / 100);
    expect(Math.abs(displayed.onDemandTiB - remained)).toBeLessThan(1);
  });
});

describe('clampToRange', () => {
  it('value below min returns min and pct 0 when moving down', () => {
    const { value, pct } = clampToRange(1000, 16000, 8000);
    expect(value).toBe(8000);
    expect(pct).toBe(100);
  });

  it('value above max returns max and pct 100 when moving down', () => {
    const { value, pct } = clampToRange(20000, 16000, 8000);
    expect(value).toBe(16000);
    expect(pct).toBe(0);
  });

  it('value in range returns value and pct -1', () => {
    const { value, pct } = clampToRange(12000, 16000, 8000);
    expect(value).toBe(12000);
    expect(pct).toBe(-1);
  });
});
