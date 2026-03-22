/**
 * Yuki Pricing & Savings – constants and chargeable-units formula.
 * Chargeable Units (YC) = Gross Units Saved (TiB eq) − Cost Equivalent of New Units in the other model.
 * Yuki Fee = Chargeable Units × YC_USD.
 */

export const DEFAULT_ON_DEMAND_TIB_PRICE = 6.25;
export const DEFAULT_STANDARD_SLOT_PRICE = 0.04;
export const DEFAULT_ENTERPRISE_SLOT_PRICE = 0.06;
export const DEFAULT_YC_USD = 2.0;

export interface PricingConfig {
  onDemandTiBPrice: number;
  standardSlotPrice: number;
  enterpriseSlotPrice: number;
  ycUsd: number;
}

export const defaultPricingConfig: PricingConfig = {
  onDemandTiBPrice: DEFAULT_ON_DEMAND_TIB_PRICE,
  standardSlotPrice: DEFAULT_STANDARD_SLOT_PRICE,
  enterpriseSlotPrice: DEFAULT_ENTERPRISE_SLOT_PRICE,
  ycUsd: DEFAULT_YC_USD,
};

export interface UsageState {
  onDemandTiB: number;
  enterpriseSlotHours: number;
  standardSlotHours: number;
}

function tbsrStandard(config: PricingConfig): number {
  return config.onDemandTiBPrice / config.standardSlotPrice;
}
function tbsrEnterprise(config: PricingConfig): number {
  return config.onDemandTiBPrice / config.enterpriseSlotPrice;
}

export function costOnDemand(tib: number, config: PricingConfig): number {
  return tib * config.onDemandTiBPrice;
}

export function costStandardSlots(hours: number, config: PricingConfig): number {
  return hours * config.standardSlotPrice;
}

export function costEnterpriseSlots(hours: number, config: PricingConfig): number {
  return hours * config.enterpriseSlotPrice;
}

export function totalGoogleCost(s: UsageState, config: PricingConfig): number {
  return (
    costOnDemand(s.onDemandTiB, config) +
    costStandardSlots(s.standardSlotHours, config) +
    costEnterpriseSlots(s.enterpriseSlotHours, config)
  );
}

/** Slot-hours per TiB (on-demand equivalent). Use standard (0.04) or enterprise (0.06) by edition. */
export function getTibPerSlotRatio(config: PricingConfig, useEnterpriseSlot: boolean): number {
  const slotPrice = useEnterpriseSlot ? config.enterpriseSlotPrice : config.standardSlotPrice;
  return config.onDemandTiBPrice / slotPrice;
}

function grossUnitsSavedTiB(
  current: UsageState,
  optimized: UsageState,
  config: PricingConfig
): number {
  const tbsrStd = tbsrStandard(config);
  const tbsrEnt = tbsrEnterprise(config);
  const odSaved = Math.max(0, current.onDemandTiB - optimized.onDemandTiB);
  const stdSaved = Math.max(0, current.standardSlotHours - optimized.standardSlotHours);
  const entSaved = Math.max(0, current.enterpriseSlotHours - optimized.enterpriseSlotHours);
  return odSaved + stdSaved / tbsrStd + entSaved / tbsrEnt;
}

function costEquivNewUnitsTiB(
  current: UsageState,
  optimized: UsageState,
  config: PricingConfig,
  equivOdTiBOverride?: number
): number {
  const tbsrStd = tbsrStandard(config);
  const tbsrEnt = tbsrEnterprise(config);
  const odAdded =
    equivOdTiBOverride !== undefined
      ? Math.max(0, equivOdTiBOverride - current.onDemandTiB)
      : Math.max(0, optimized.onDemandTiB - current.onDemandTiB);
  const stdAdded = Math.max(0, optimized.standardSlotHours - current.standardSlotHours);
  const entAdded = Math.max(0, optimized.enterpriseSlotHours - current.enterpriseSlotHours);
  return odAdded + stdAdded / tbsrStd + entAdded / tbsrEnt;
}

export function chargeableUnitsAndFee(
  current: UsageState,
  optimized: UsageState,
  config: PricingConfig,
  options?: { equivOdTiB?: number }
): { chargeableYC: number; yukiFeeUSD: number } {
  const gross = grossUnitsSavedTiB(current, optimized, config);
  const equiv = costEquivNewUnitsTiB(
    current,
    optimized,
    config,
    options?.equivOdTiB
  );
  const chargeableYC = Math.round(Math.max(0, gross - equiv) * 100) / 100;
  const yukiFeeUSD = chargeableYC * config.ycUsd;
  return { chargeableYC, yukiFeeUSD };
}

/** Consumption and $ for the “New Total Cost” state (same basis as `newTotalCost`). */
export interface NewTotalCostBreakdown {
  onDemandTiB: number;
  standardSlotHours: number;
  enterpriseSlotHours: number;
  costOnDemandUSD: number;
  costStandardSlotsUSD: number;
  costEnterpriseSlotsUSD: number;
}

export interface DashboardMetrics {
  totalOriginalCost: number;
  newTotalCost: number;
  newTotalBreakdown: NewTotalCostBreakdown;
  grossSavings: number;
  chargeableYC: number;
  yukiFeeUSD: number;
  customerNetSavings: number;
  yukiCapturePercent: number;
}

export interface ComputeMetricsOptions {
  /** For Slots→OD: use only Yuki's OD in chargeable equiv (not OD from moved slots). */
  equivOdTiB?: number;
}

export function computeMetrics(
  current: UsageState,
  optimized: UsageState,
  config: PricingConfig = defaultPricingConfig,
  options?: ComputeMetricsOptions
): DashboardMetrics {
  const originalCost = totalGoogleCost(current, config);
  // Slots→OD: "New Total Cost" = remained slots + Yuki's OD only (1.25M×0.04 + 1600×6.25 = $60k).
  const newCostState: UsageState =
    options?.equivOdTiB != null
      ? { ...optimized, onDemandTiB: options.equivOdTiB }
      : optimized;
  const newGoogleCost = totalGoogleCost(newCostState, config);
  const newTotalBreakdown: NewTotalCostBreakdown = {
    onDemandTiB: newCostState.onDemandTiB,
    standardSlotHours: newCostState.standardSlotHours,
    enterpriseSlotHours: newCostState.enterpriseSlotHours,
    costOnDemandUSD: costOnDemand(newCostState.onDemandTiB, config),
    costStandardSlotsUSD: costStandardSlots(newCostState.standardSlotHours, config),
    costEnterpriseSlotsUSD: costEnterpriseSlots(newCostState.enterpriseSlotHours, config),
  };
  const grossSavings = originalCost - newGoogleCost;
  const { chargeableYC, yukiFeeUSD } = chargeableUnitsAndFee(
    current,
    optimized,
    config,
    options
  );
  const customerNetSavings = grossSavings - yukiFeeUSD;
  const yukiCapturePercent =
    grossSavings > 0 ? (yukiFeeUSD / grossSavings) * 100 : 0;

  return {
    totalOriginalCost: originalCost,
    newTotalCost: newGoogleCost,
    newTotalBreakdown,
    grossSavings,
    chargeableYC,
    yukiFeeUSD,
    customerNetSavings,
    yukiCapturePercent,
  };
}
