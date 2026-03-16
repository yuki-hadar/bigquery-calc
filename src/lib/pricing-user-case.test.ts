import { describe, it, expect } from 'vitest';
import {
  chargeableUnitsAndFee,
  computeMetrics,
  defaultPricingConfig,
  totalGoogleCost,
} from './pricing';
import type { UsageState } from './pricing';

const config = defaultPricingConfig;

/**
 * User-reported case: original OD 41002, remained OD 18919, Yuki slots 827526 (standard $0.04), OD $6.25
 * 1) New total cost = 18919*6.25 + 827526*0.04 = 118,243.75 + 33,101.04 = 151,344.79 ≈ 151,343
 * 2) Chargeable (savings in TiB eq) = 41002 - 18919 - 827526/156.25 = 16,787 (156.25 = 6.25/0.04)
 */
describe('User case: original 41002, remained OD 18919, Yuki slots 827526', () => {
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

  it('total cost (OD 18919 * 6.25 + slots 827526 * 0.04) should be 151,343', () => {
    const cost = totalGoogleCost(withYuki, config);
    const expected = 151343;
    expect(Math.abs(cost - expected)).toBeLessThanOrEqual(2);
  });

  it('chargeable YC (41002 - 18919 - 827526/156.25) should be 16,787', () => {
    const metrics = computeMetrics(original, withYuki, config);
    const expectedChargeable = 16787;
    expect(Math.abs(metrics.chargeableYC - expectedChargeable)).toBeLessThanOrEqual(1);
  });
});
