import { chargeableUnitsAndFee, defaultPricingConfig } from './pricing';
import type { UsageState } from './pricing';
const config = defaultPricingConfig;

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
console.log('All pricing scenarios passed.');
