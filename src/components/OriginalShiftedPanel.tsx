import type { UsageState } from '../lib/pricing';

function fmtNum(n: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}

interface OriginalShiftedPanelProps {
  original: UsageState;
  displayed: UsageState;
}

export function OriginalShiftedPanel({ original, displayed }: OriginalShiftedPanelProps) {
  const originalSlots = original.standardSlotHours + original.enterpriseSlotHours;
  const displayedSlots = displayed.standardSlotHours + displayed.enterpriseSlotHours;
  const shiftedOd = Math.max(0, original.onDemandTiB - displayed.onDemandTiB);
  const shiftedSlotsDelta = Math.max(0, displayedSlots - originalSlots);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white shadow-sm p-4">
      <h3 className="text-sm font-semibold text-neutral-600 mb-4">
        Original customer vs shifted to Yuki
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
            Original on-demand TiB
          </p>
          <p className="mt-1 text-lg font-semibold text-neutral-900 font-mono">
            {fmtNum(original.onDemandTiB)}
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
            Original Slot-hours
          </p>
          <p className="mt-1 text-lg font-semibold text-neutral-900 font-mono">
            {fmtNum(originalSlots)}
          </p>
        </div>
        <div className="rounded-lg border border-violet-200 bg-violet-50/60 p-3">
          <p className="text-xs font-medium text-violet-600 uppercase tracking-wider">
            Shifted on-demand TiB
          </p>
          <p className="mt-1 text-lg font-semibold text-violet-900 font-mono">
            {fmtNum(shiftedOd)}
          </p>
          <p className="mt-0.5 text-xs text-neutral-500">moved off on-demand</p>
        </div>
        <div className="rounded-lg border border-violet-200 bg-violet-50/60 p-3">
          <p className="text-xs font-medium text-violet-600 uppercase tracking-wider">
            Shifted Slot-hours
          </p>
          <p className="mt-1 text-lg font-semibold text-violet-900 font-mono">
            {fmtNum(shiftedSlotsDelta)}
          </p>
          <p className="mt-0.5 text-xs text-neutral-500">slot-hours shifted to Yuki</p>
        </div>
      </div>
    </div>
  );
}
