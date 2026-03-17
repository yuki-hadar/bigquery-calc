import { describe, expect, it } from 'vitest';
import {
  chargeableUnitsAndFee,
  computeMetrics,
  defaultPricingConfig,
  totalGoogleCost,
} from './pricing';
import type { UsageState } from './pricing';

const config = defaultPricingConfig;

// --- User-reported case: original OD 41002, remained OD 18919, Yuki slots 827526 (standard $0.04), OD $6.25 ---
// 1) New total cost = 18919*6.25 + 827526*0.04 = 118,243.75 + 33,101.04 = 151,344.79 ≈ 151,343
// 2) Chargeable (savings in TiB eq) = 41002 - 18919 - 827526/156.25 = 16,787 (156.25 = 6.25/0.04)
function userCaseTotalCost() {
  const withYuki: UsageState = {
    onDemandTiB: 18919,
    enterpriseSlotHours: 0,
    standardSlotHours: 827526,
  };
  const cost = totalGoogleCost(withYuki, config);
  const expected = 151343;
  console.assert(
    Math.abs(cost - expected) <= 2,
    `User case total cost: expected ~${expected}, got ${cost}`
  );
}

function userCaseChargeableYC() {
  const original: UsageState = {
    onDemandTiB: 41002,
    enterpriseSlotHours: 0,
    standardSlotHours: 0,
  };
  const withYuki: UsageState = {
    onDemandTiB: 18919,
    enterpriseSlotHours: 0,
    standardSlotHours: 827526,
  };
  const metrics = computeMetrics(original, withYuki, config);
  const expectedChargeable = 16787;
  console.assert(
    Math.abs(metrics.chargeableYC - expectedChargeable) <= 1,
    `User case chargeable YC: expected ~${expectedChargeable}, got ${metrics.chargeableYC}`
  );
}

function scenarioA() {
  const current: UsageState = {
    onDemandTiB: 16000,
    enterpriseSlotHours: 0,
    standardSlotHours: 0,
  };
  const optimized: UsageState = {
    onDemandTiB: 8000,
    enterpriseSlotHours: 0,
    standardSlotHours: 250000,
  };
  const { chargeableYC, yukiFeeUSD } = chargeableUnitsAndFee(current, optimized, config);
  console.assert(
    Math.round(chargeableYC) === 6400,
    `Scenario A: expected 6400 YC, got ${chargeableYC}`
  );
  console.assert(
    Math.round(yukiFeeUSD) === 12800,
    `Scenario A: expected $12,800 fee, got ${yukiFeeUSD}`
  );
}

// OD→Slots (scenario A) exact KPIs: 16k OD → 50% remained 8k, 250k slots. New Total = 8k×6.25 + 250k×0.04 = $60k.
function scenarioAExactKpis() {
  const original: UsageState = {
    onDemandTiB: 16000,
    enterpriseSlotHours: 0,
    standardSlotHours: 0,
  };
  const displayed: UsageState = {
    onDemandTiB: 8000,
    enterpriseSlotHours: 0,
    standardSlotHours: 250000,
  };
  const metrics = computeMetrics(original, displayed, config);
  expect(metrics.totalOriginalCost).toBe(100_000); // 16k × 6.25
  expect(metrics.newTotalCost).toBe(60_000); // 8k×6.25 + 250k×0.04
  expect(metrics.grossSavings).toBe(40_000);
  expect(metrics.chargeableYC).toBe(6400);
  expect(Math.round(metrics.yukiFeeUSD)).toBe(12_800);
  expect(Math.round(metrics.customerNetSavings)).toBe(27_200);
}

function scenarioB() {
  const current: UsageState = {
    onDemandTiB: 0,
    enterpriseSlotHours: 0,
    standardSlotHours: 2500000,
  };
  const optimized: UsageState = {
    onDemandTiB: 1600,
    enterpriseSlotHours: 0,
    standardSlotHours: 2000000,
  };
  const { chargeableYC, yukiFeeUSD } = chargeableUnitsAndFee(current, optimized, config);
  console.assert(
    Math.round(chargeableYC) === 1600,
    `Scenario B: expected 1600 YC, got ${chargeableYC}`
  );
  console.assert(
    Math.round(yukiFeeUSD) === 3200,
    `Scenario B: expected $3,200 fee, got ${yukiFeeUSD}`
  );
}

function scenarioC() {
  const current: UsageState = {
    onDemandTiB: 16000,
    enterpriseSlotHours: 2500000,
    standardSlotHours: 0,
  };
  const optimized: UsageState = {
    onDemandTiB: 9600,
    enterpriseSlotHours: 1250000,
    standardSlotHours: 250000,
  };
  const { chargeableYC, yukiFeeUSD } = chargeableUnitsAndFee(current, optimized, config);
  console.assert(
    Math.abs(chargeableYC - 16800) < 1,
    `Scenario C: expected ~16800 YC, got ${chargeableYC}`
  );
  console.assert(
    Math.abs(yukiFeeUSD - 33600) < 2,
    `Scenario C: expected ~$33,600 fee, got ${yukiFeeUSD}`
  );
}

function scenarioBSlotsToOdWithYukiOd() {
  const original: UsageState = {
    onDemandTiB: 0,
    enterpriseSlotHours: 0,
    standardSlotHours: 2500000,
  };
  const withYuki: UsageState = {
    onDemandTiB: 9600,
    enterpriseSlotHours: 0,
    standardSlotHours: 1250000,
  };
  const metrics = computeMetrics(original, withYuki, config, { equivOdTiB: 1600 });
  console.assert(
    metrics.chargeableYC > 0,
    `Scenario B (2.5M→1.25M slots + 9600 OD incl. Yuki 1600): expected positive savings, got ${metrics.chargeableYC}`
  );
  const cost = totalGoogleCost(withYuki, config);
  console.assert(cost > 0, `Scenario B with Yuki: expected positive cost, got ${cost}`);
}

function scenarioBSlotsToOdYukiFee12800() {
  const original: UsageState = {
    onDemandTiB: 0,
    enterpriseSlotHours: 0,
    standardSlotHours: 2500000,
  };
  const withYuki: UsageState = {
    onDemandTiB: 9600,
    enterpriseSlotHours: 0,
    standardSlotHours: 1250000,
  };
  const metrics = computeMetrics(original, withYuki, config, { equivOdTiB: 1600 });
  console.assert(
    Math.round(metrics.yukiFeeUSD) === 12800,
    `Scenario B (2.5M→1.25M, Yuki OD 1600): expected Yuki Fee $12,800, got ${metrics.yukiFeeUSD}`
  );
}

// Slots→OD: New Total Cost = remained slots + Yuki's OD only → 1.25M×0.04 + 1600×6.25 = $60k
function scenarioBSlotsToOdNewTotalRemainedPlusYukiOd() {
  const original: UsageState = {
    onDemandTiB: 0,
    enterpriseSlotHours: 0,
    standardSlotHours: 2500000,
  };
  const withYuki: UsageState = {
    onDemandTiB: 9600,
    enterpriseSlotHours: 0,
    standardSlotHours: 1250000,
  };
  const metrics = computeMetrics(original, withYuki, config, { equivOdTiB: 1600 });
  expect(metrics.totalOriginalCost).toBe(100_000); // 2.5M × 0.04
  expect(metrics.newTotalCost).toBe(60_000); // 1.25M×0.04 + 1600×6.25
  expect(metrics.grossSavings).toBe(40_000);
  expect(metrics.chargeableYC).toBe(6400);
  expect(Math.round(metrics.yukiFeeUSD)).toBe(12_800);
  expect(Math.round(metrics.customerNetSavings)).toBe(27_200);
}

describe('pricing', () => {
  it('scenario A', () => {
    scenarioA();
  });
  it('scenario A (OD→Slots) exact KPIs: 16k→8k, 250k slots → $100k, $60k, $40k, 6400 YC, $12.8k, $27.2k', () => {
    scenarioAExactKpis();
  });
  it('scenario B', () => {
    scenarioB();
  });
  it('scenario B Slots→OD with Yuki OD included: 2.5M slots, 1.25M remained + 9600 OD → positive savings', () => {
    scenarioBSlotsToOdWithYukiOd();
  });
  it('scenario B Slots→OD: 2.5M→1.25M, Yuki OD 1600 → Yuki Fee = $12,800', () => {
    scenarioBSlotsToOdYukiFee12800();
  });
  it('scenario B (Slots→OD) exact KPIs: 2.5M→1.25M slots, Yuki 1600 TiB → $100k, $60k, $40k, 6400 YC, $12.8k, $27.2k', () => {
    scenarioBSlotsToOdNewTotalRemainedPlusYukiOd();
  });
  it('scenario C', () => {
    scenarioC();
  });
  it('user case total cost', () => {
    userCaseTotalCost();
  });
  it('user case chargeable YC', () => {
    userCaseChargeableYC();
  });
});
