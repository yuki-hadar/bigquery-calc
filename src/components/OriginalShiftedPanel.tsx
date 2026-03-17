import type { UsageState, PricingConfig } from '../lib/pricing';
import { getTibPerSlotRatio } from '../lib/pricing';
import type { Scenario, Edition } from './Sidebar';

function fmtNum(n: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}

interface OriginalShiftedPanelProps {
  original: UsageState;
  displayed: UsageState;
  scenario: Scenario | null;
  /** For scenario B: chargeable YC (TiB eq) so Deducted shows 6,400 TiB = 1,000,000 slot-hrs */
  chargeableYC?: number;
  config: PricingConfig;
  edition: Edition;
}

export function OriginalShiftedPanel({ original, displayed, scenario, chargeableYC, config, edition }: OriginalShiftedPanelProps) {
  const tibPerSlotRatio = getTibPerSlotRatio(config, edition === 'enterprise');
  const originalSlots = original.standardSlotHours + original.enterpriseSlotHours;
  const displayedSlots = displayed.standardSlotHours + displayed.enterpriseSlotHours;
  const shiftedOd = Math.max(0, original.onDemandTiB - displayed.onDemandTiB);
  const shiftedSlotsDelta = Math.max(0, displayedSlots - originalSlots);
  const shiftedSlotsToOd = Math.max(0, originalSlots - displayedSlots); // slots moved off (B)
  const deductedTibFromSlots = displayedSlots / tibPerSlotRatio; // slot-hrs as TiB equiv (A)
  const addedOdTiB = Math.max(0, displayed.onDemandTiB - original.onDemandTiB); // total OD added in B
  const chargeableTiBB = chargeableYC ?? addedOdTiB;
  const deductedSlotHoursB = chargeableTiBB * tibPerSlotRatio; // B: chargeable (or full OD) in slot-hr equivalent
  const netSlotHoursB = shiftedSlotsToOd - deductedSlotHoursB; // B: shifted − deducted slot-hrs
  const yukiCreditsA = shiftedOd - deductedTibFromSlots; // A: Shifted On-Demand TiB − Deducted TiB
  const yukiCreditsB = chargeableYC ?? netSlotHoursB / tibPerSlotRatio; // B: use chargeable YC when provided
  const slotPrice = edition === 'enterprise' ? config.enterpriseSlotPrice : config.standardSlotPrice;

  const isA = scenario === 'A';
  const isB = scenario === 'B';

  return (
    <div className="rounded-xl border border-neutral-200 bg-white shadow-sm p-4">
      <h3 className="text-sm font-semibold text-neutral-600 mb-4">
        Original customer vs shifted to Yuki
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
            Original On-Demand TiB
          </p>
          <p className="mt-1 text-lg font-semibold text-neutral-900 font-mono">
            {fmtNum(original.onDemandTiB)}
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
            Original reservation slot hours
          </p>
          <p className="mt-1 text-lg font-semibold text-neutral-900 font-mono">
            {fmtNum(originalSlots)}
          </p>
        </div>
        {!isB && (
          <div className="rounded-lg border border-violet-200 bg-violet-50/60 p-3">
            <p className="text-xs font-medium text-violet-600 uppercase tracking-wider">
              Shifted On-Demand TiB
            </p>
            <p className="mt-1 text-lg font-semibold text-violet-900 font-mono">
              {fmtNum(shiftedOd)}
            </p>
            <p className="mt-0.5 text-xs text-neutral-500">
              (original − remained) = {fmtNum(original.onDemandTiB)} − {fmtNum(displayed.onDemandTiB)}
            </p>
          </div>
        )}
        {isA && (
          <div className="rounded-lg border border-violet-200 bg-violet-50/60 p-3">
            <p className="text-xs font-medium text-violet-600 uppercase tracking-wider">
              Deducted TiB
            </p>
            <p className="mt-1 text-lg font-semibold text-violet-900 font-mono">
              {fmtNum(deductedTibFromSlots)}
            </p>
            <p className="mt-0.5 text-xs text-neutral-500 font-mono">
              {fmtNum(displayedSlots)} ÷ {tibPerSlotRatio.toFixed(2)} ({config.onDemandTiBPrice}÷{slotPrice.toFixed(2)})
            </p>
          </div>
        )}
        {isB && (
          <>
            <div className="rounded-lg border border-violet-200 bg-violet-50/60 p-3">
              <p className="text-xs font-medium text-violet-600 uppercase tracking-wider">
                Shifted reservation slot hours
              </p>
              <p className="mt-1 text-lg font-semibold text-violet-900 font-mono">
                {fmtNum(shiftedSlotsToOd)}
              </p>
              <p className="mt-0.5 text-xs text-neutral-500">moved off slots</p>
            </div>
            <div className="rounded-lg border border-violet-200 bg-violet-50/60 p-3">
              <p className="text-xs font-medium text-violet-600 uppercase tracking-wider">
                Deducted reservation slot hours
              </p>
              <p className="mt-1 text-lg font-semibold text-violet-900 font-mono">
                {fmtNum(deductedSlotHoursB)}
              </p>
              <p className="mt-0.5 text-xs text-neutral-500 font-mono">
                {fmtNum(chargeableTiBB)} On-Demand TiB × {tibPerSlotRatio.toFixed(2)}
              </p>
            </div>
          </>
        )}
        {!isA && !isB && (
          <div className="rounded-lg border border-violet-200 bg-violet-50/60 p-3">
            <p className="text-xs font-medium text-violet-600 uppercase tracking-wider">
              Shifted reservation slot hours
            </p>
            <p className="mt-1 text-lg font-semibold text-violet-900 font-mono">
              {fmtNum(shiftedSlotsDelta)}
            </p>
            <p className="mt-0.5 text-xs text-neutral-500">slot hours shifted to Yuki</p>
          </div>
        )}
      </div>
      {isA && (
        <div className="mt-3 rounded-lg border border-violet-300 bg-violet-100/50 px-3 py-2 text-center">
          <p className="text-xs font-medium text-violet-700">
            Yuki Credits = Shifted On-Demand TiB − Deducted TiB = {fmtNum(shiftedOd)} − {fmtNum(deductedTibFromSlots)} ={' '}
            <span className="font-mono font-semibold">{fmtNum(yukiCreditsA)}</span>
          </p>
        </div>
      )}
      {isB && (
        <div className="mt-3 rounded-lg border border-violet-300 bg-violet-100/50 px-3 py-2 text-center">
          <p className="text-xs font-medium text-violet-700">
            Yuki Credits = Deducted slot hours ÷ {tibPerSlotRatio.toFixed(2)} = {fmtNum(deductedSlotHoursB)} ÷ {tibPerSlotRatio.toFixed(2)} ={' '}
            <span className="font-mono font-semibold">{fmtNum(yukiCreditsB)}</span>
          </p>
        </div>
      )}
    </div>
  );
}
