import { describe, it, expect } from 'vitest';
import {
  impliedPct,
  clampToRange,
  lerpUsage,
  effectiveDisplayedForScenarioA,
  remainedOdToPct,
  effectiveDisplayedForScenarioB,
  remainedSlotsToPct,
} from './calc';
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

describe('OD→Reservation (scenario A)', () => {
  it('lerp at 60% gives remained on-demand TiB 11200', () => {
    const original: UsageState = { onDemandTiB: 16000, enterpriseSlotHours: 0, standardSlotHours: 0 };
    const optimized: UsageState = { onDemandTiB: 8000, enterpriseSlotHours: 0, standardSlotHours: 250000 };
    const displayed = lerpUsage(original, optimized, 0.6);
    expect(displayed.onDemandTiB).toBe(11200);
  });

  it('effectiveDisplayedForScenarioA: 50% remained with 16000 original gives 8000 TiB', () => {
    const original: UsageState = { onDemandTiB: 16000, enterpriseSlotHours: 0, standardSlotHours: 0 };
    const optimized: UsageState = { onDemandTiB: 8000, enterpriseSlotHours: 0, standardSlotHours: 250000 };
    const result = effectiveDisplayedForScenarioA(original, optimized, 50);
    expect(result.onDemandTiB).toBe(8000);
  });

  it('remainedOdToPct: 8000 of 16000 gives 50', () => {
    expect(remainedOdToPct(16000, 8000)).toBe(50);
  });

  it('scenario A exact: 50% remained → 8000 OD, 250k slots (matches e2e/pricing KPIs)', () => {
    const original: UsageState = { onDemandTiB: 16000, enterpriseSlotHours: 0, standardSlotHours: 0 };
    const optimized: UsageState = { onDemandTiB: 8000, enterpriseSlotHours: 0, standardSlotHours: 250000 };
    const result = effectiveDisplayedForScenarioA(original, optimized, 50);
    expect(result.onDemandTiB).toBe(8000);
    expect(result.standardSlotHours).toBe(250000);
  });

  it('impliedPct for remained 18919 gives ~67%', () => {
    const original: UsageState = { onDemandTiB: 41002, enterpriseSlotHours: 0, standardSlotHours: 0 };
    const optimized: UsageState = { onDemandTiB: 8000, enterpriseSlotHours: 0, standardSlotHours: 250000 };
    const pct = impliedPct(original, optimized, 'onDemandTiB', 18919);
    expect(pct).toBeGreaterThanOrEqual(66);
    expect(pct).toBeLessThanOrEqual(68);
  });
});

describe('Slots→OD (scenario B)', () => {
  it('effectiveDisplayedForScenarioB: 50.2% with 2.5M original slots gives remained 1,255,000 (not lerp 2,249,000)', () => {
    const original: UsageState = { onDemandTiB: 0, enterpriseSlotHours: 0, standardSlotHours: 2500000 };
    const optimized: UsageState = { onDemandTiB: 1600, enterpriseSlotHours: 0, standardSlotHours: 2000000 };
    const result = effectiveDisplayedForScenarioB(original, optimized, 50.2);
    const remainedSlots = result.standardSlotHours + result.enterpriseSlotHours;
    expect(remainedSlots).toBe(1255000); // 2,500,000 * 0.502
    // Bug: lerp would give 2,500,000 + (2,000,000 - 2,500,000) * 0.502 = 2,249,000
    const lerpResult = lerpUsage(original, optimized, 50.2 / 100);
    const lerpSlots = lerpResult.standardSlotHours + lerpResult.enterpriseSlotHours;
    expect(lerpSlots).toBe(2249000);
  });

  it('remainedSlotsToPct: 1,255,000 of 2,500,000 gives 50.2', () => {
    const pct = remainedSlotsToPct(2500000, 1255000);
    expect(pct).toBeCloseTo(50.2, 1);
  });

  it('effectiveDisplayedForScenarioB includes Yuki on-demand TiB: 2.5M slots, 50% remained, Yuki 1600 OD → total OD 9600', () => {
    const original: UsageState = { onDemandTiB: 0, enterpriseSlotHours: 0, standardSlotHours: 2500000 };
    const optimized: UsageState = { onDemandTiB: 1600, enterpriseSlotHours: 0, standardSlotHours: 2000000 };
    const result = effectiveDisplayedForScenarioB(original, optimized, 50);
    expect(result.standardSlotHours + result.enterpriseSlotHours).toBe(1250000); // 50% of 2.5M
    const addedFromSlots = (2500000 - 1250000) / 156.25; // 8000 TiB
    expect(result.onDemandTiB).toBe(addedFromSlots + 1600); // 8000 + 1600 = 9600
    expect(result.onDemandTiB).toBe(9600);
  });

  it('scenario B exact: 50% remained → 1.25M slots, 9600 OD (matches e2e/pricing KPIs)', () => {
    const original: UsageState = { onDemandTiB: 0, enterpriseSlotHours: 0, standardSlotHours: 2500000 };
    const optimized: UsageState = { onDemandTiB: 1600, enterpriseSlotHours: 0, standardSlotHours: 2000000 };
    const result = effectiveDisplayedForScenarioB(original, optimized, 50);
    expect(result.standardSlotHours + result.enterpriseSlotHours).toBe(1250000);
    expect(result.onDemandTiB).toBe(9600);
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
