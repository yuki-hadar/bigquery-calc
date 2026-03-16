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

scenarioA();
scenarioB();
scenarioC();
userCaseTotalCost();
userCaseChargeableYC();
console.log('All pricing scenarios passed.');
