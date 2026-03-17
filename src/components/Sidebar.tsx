import { useState, useEffect, useRef } from 'react';
import type { UsageState } from '../lib/pricing';
import type { PricingConfig } from '../lib/pricing';
import { impliedPct, clampToRange, remainedOdToPct, remainedSlotsToPct } from '../lib/calc';

const SLIDER_DEBOUNCE_MS = 500;


export type Edition = 'standard' | 'enterprise';
export type Scenario = 'A' | 'B' | 'C';

interface SidebarProps {
  original: UsageState;
  optimized: UsageState;
  /** Shown in Remained fields; for scenario B this is effectiveDisplayed (remained slots = original * pct/100). */
  displayedForRemained: UsageState;
  config: PricingConfig;
  queriesMovedPct: number;
  edition: Edition;
  scenario: Scenario | null;
  onOriginalChange: (s: UsageState) => void;
  onOptimizedChange: (s: UsageState) => void;
  onConfigChange: (c: PricingConfig) => void;
  onQueriesMovedPctChange: (pct: number) => void;
  onEditionChange: (e: Edition) => void;
  onScenarioChange: (s: Scenario | null) => void;
}

function parseInput(s: string): number {
  const v = s.replace(/[,\s]/g, '').replace(/[mM]$/, '000000').replace(/[kK]$/, '000');
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

export function Sidebar({
  original,
  optimized,
  displayedForRemained,
  config,
  queriesMovedPct,
  edition,
  scenario,
  onOriginalChange,
  onOptimizedChange,
  onConfigChange,
  onQueriesMovedPctChange,
  onEditionChange,
  onScenarioChange,
}: SidebarProps) {
  const updateOriginal = (key: keyof UsageState, value: number) =>
    onOriginalChange({ ...original, [key]: value });
  const updateConfig = (key: keyof PricingConfig, value: number) =>
    onConfigChange({ ...config, [key]: value });

  const [sliderValue, setSliderValue] = useState(queriesMovedPct);
  const sliderDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    setSliderValue(queriesMovedPct);
  }, [queriesMovedPct]);
  useEffect(() => () => {
    if (sliderDebounceRef.current) clearTimeout(sliderDebounceRef.current);
  }, []);

  const handleSliderChange = (next: number) => {
    setSliderValue(next);
    if (sliderDebounceRef.current) clearTimeout(sliderDebounceRef.current);
    sliderDebounceRef.current = setTimeout(() => {
      if (Math.abs(next - queriesMovedPct) >= 0.01) {
        try {
          onQueriesMovedPctChange(next);
        } catch (_) {}
      }
      sliderDebounceRef.current = null;
    }, SLIDER_DEBOUNCE_MS);
  };

  type RemainedField = 'od' | 'slots' | 'otherSlots';
  const [remainedPending, setRemainedPending] = useState<{ field: RemainedField; displayValue: string } | null>(null);

  const commitRemained = (
    field: 'onDemandTiB' | 'standardSlotHours' | 'enterpriseSlotHours',
    rawValue: number
  ) => {
    // Scenario A (OD→Slots): slider is "remained %" for on-demand TiB
    if (scenario === 'A' && field === 'onDemandTiB') {
      onQueriesMovedPctChange(remainedOdToPct(original.onDemandTiB, rawValue));
      return;
    }
    // Scenario B (Slots→OD): slider is "remained %" for slots
    if (scenario === 'B' && (field === 'standardSlotHours' || field === 'enterpriseSlotHours')) {
      const originalSlots = original.standardSlotHours + original.enterpriseSlotHours;
      onQueriesMovedPctChange(remainedSlotsToPct(originalSlots, rawValue));
      return;
    }
    const orig = original[field];
    const opt = optimized[field];
    const { pct } = clampToRange(rawValue, orig, opt);
    if (pct >= 0) {
      onQueriesMovedPctChange(pct);
    } else {
      onQueriesMovedPctChange(impliedPct(original, optimized, field, rawValue));
    }
  };

  const scenarioConfigs: Record<Scenario, { original: UsageState; optimized: UsageState }> = {
    A: {
      original: { onDemandTiB: 16000, enterpriseSlotHours: 0, standardSlotHours: 0 },
      optimized: { onDemandTiB: 8000, enterpriseSlotHours: 0, standardSlotHours: 250000 },
    },
    B: {
      original: { onDemandTiB: 0, enterpriseSlotHours: 0, standardSlotHours: 2500000 },
      optimized: { onDemandTiB: 1600, enterpriseSlotHours: 0, standardSlotHours: 2000000 },
    },
    C: {
      original: { onDemandTiB: 16000, enterpriseSlotHours: 2500000, standardSlotHours: 0 },
      optimized: { onDemandTiB: 9600, enterpriseSlotHours: 1250000, standardSlotHours: 250000 },
    },
  };

  const showOriginalOd = scenario === null || scenario === 'A' || scenario === 'C';
  const showOriginalSlots = scenario === null || scenario === 'B' || scenario === 'C';
  const showNewOd = scenario === null || scenario === 'A' || scenario === 'B' || scenario === 'C';
  const showNewSlots = scenario === null || scenario === 'A' || scenario === 'B' || scenario === 'C';
  const slotsLabel = edition === 'enterprise' ? 'Enterprise Slot-Hours' : 'Standard Slot-Hours';

  return (
    <aside className="w-full lg:w-80 shrink-0 border-b lg:border-b-0 lg:border-r border-neutral-200 bg-neutral-50 p-5 lg:p-6 flex flex-col gap-6 overflow-y-auto">
      <div>
        <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
          Scenario
        </h2>
        <div className="flex gap-2">
          {(['A', 'B', 'C'] as const).map((s) => {
            const label = s === 'A' ? 'On-demand→Slots' : s === 'B' ? 'Slots→On-demand' : 'Hybrid';
            const selected = scenario === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => {
                  onScenarioChange(s);
                  const cfg = scenarioConfigs[s];
                  onOriginalChange(cfg.original);
                  onOptimizedChange(cfg.optimized);
                }}
                className={`flex-1 px-2 py-2 rounded-lg text-xs font-medium transition-colors ${
                  selected
                    ? 'bg-violet-200 text-violet-900 border border-violet-300'
                    : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300 border border-transparent'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
          Pricing constants
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs text-neutral-600">Yuki Credit price ($)</span>
            <input
              type="number"
              min={0}
              step={0.01}
              value={config.ycUsd.toFixed(2)}
              onChange={(e) => updateConfig('ycUsd', parseFloat(e.target.value) || 0)}
              className="mt-0.5 w-full rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-neutral-900 font-mono text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs text-neutral-600">On-demand $/TiB</span>
            <input
              type="number"
              min={0}
              step={0.25}
              value={config.onDemandTiBPrice}
              onChange={(e) => updateConfig('onDemandTiBPrice', parseFloat(e.target.value) || 0)}
              className="mt-0.5 w-full rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-neutral-900 font-mono text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs text-neutral-600">Standard $/hr</span>
            <input
              type="number"
              min={0}
              step={0.01}
              value={config.standardSlotPrice}
              onChange={(e) => updateConfig('standardSlotPrice', parseFloat(e.target.value) || 0)}
              className="mt-0.5 w-full rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-neutral-900 font-mono text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs text-neutral-600">Enterprise $/hr</span>
            <input
              type="number"
              min={0}
              step={0.01}
              value={config.enterpriseSlotPrice}
              onChange={(e) => updateConfig('enterpriseSlotPrice', parseFloat(e.target.value) || 0)}
              className="mt-0.5 w-full rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-neutral-900 font-mono text-sm"
            />
          </label>
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
          Edition
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onEditionChange('standard')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              edition === 'standard'
                ? 'bg-violet-600 text-white'
                : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'
            }`}
          >
            Standard
          </button>
          <button
            type="button"
            onClick={() => onEditionChange('enterprise')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              edition === 'enterprise'
                ? 'bg-violet-600 text-white'
                : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'
            }`}
          >
            Enterprise
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
          Original state
        </h2>
        <div className="space-y-4">
          {showOriginalOd && (
            <label className="block">
              <span className="text-xs text-neutral-600">Original on-demand TiB</span>
              <input
                type="number"
                min={0}
                step={100}
                value={original.onDemandTiB || ''}
                onChange={(e) => updateOriginal('onDemandTiB', parseInput(e.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 font-mono text-sm"
              />
            </label>
          )}
          {showOriginalSlots && (
            <label className="block">
              <span className="text-xs text-neutral-600">Original {slotsLabel}</span>
              <input
                type="number"
                min={0}
                step={10000}
                value={edition === 'enterprise' ? original.enterpriseSlotHours || '' : original.standardSlotHours || ''}
                onChange={(e) =>
                  edition === 'enterprise'
                    ? updateOriginal('enterpriseSlotHours', parseInput(e.target.value) || 0)
                    : updateOriginal('standardSlotHours', parseInput(e.target.value) || 0)
                }
                className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 font-mono text-sm"
              />
            </label>
          )}
          {(scenario === null || scenario === 'C') && (
            <>
              {edition === 'enterprise' && (
                <label className="block">
                  <span className="text-xs text-neutral-600">Original Standard Slot-Hours</span>
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    value={original.standardSlotHours || ''}
                    onChange={(e) => updateOriginal('standardSlotHours', parseInput(e.target.value) || 0)}
                    className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 font-mono text-sm"
                  />
                </label>
              )}
              {edition === 'standard' && (
                <label className="block">
                  <span className="text-xs text-neutral-600">Original Enterprise Slot-Hours</span>
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    value={original.enterpriseSlotHours || ''}
                    onChange={(e) => updateOriginal('enterpriseSlotHours', parseInput(e.target.value) || 0)}
                    className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 font-mono text-sm"
                  />
                </label>
              )}
            </>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
          {(scenario === 'A' || scenario === 'B') ? 'Remained (%)' : 'Queries moved (%)'}
        </h2>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={100}
            step={0.1}
            value={sliderValue}
            onChange={(e) => handleSliderChange(Number(e.target.value))}
            className="flex-1 h-2 rounded-lg appearance-none bg-neutral-200 accent-violet-600"
          />
          <span className="text-sm font-mono text-neutral-800 w-12">
            {sliderValue % 1 === 0 ? Math.round(sliderValue) : sliderValue.toFixed(1)}%
          </span>
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
          Existing + Yuki (optimized state)
        </h2>
        <div className="space-y-4">
          {/* Remained (1 - queries moved) — first */}
          {showNewOd && (scenario === null || scenario !== 'B') && (
            <label className="block">
              <span className="text-xs text-neutral-600">Remained on-demand TiB</span>
              <input
                data-testid="remained-on-demand-tib"
                type="text"
                inputMode="decimal"
                value={
                  remainedPending?.field === 'od'
                    ? remainedPending.displayValue
                    : String(displayedForRemained.onDemandTiB || '')
                }
                onChange={(e) => {
                  const raw = e.target.value;
                  setRemainedPending({ field: 'od', displayValue: raw });
                  const v = parseInput(raw) || 0;
                  commitRemained('onDemandTiB', v);
                }}
                onBlur={() => setRemainedPending(null)}
                className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 font-mono text-sm"
              />
            </label>
          )}
          {showNewSlots && (scenario === null || scenario === 'B' || scenario === 'C') && (
            <label className="block">
              <span className="text-xs text-neutral-600">
                {scenario === 'B' ? 'Remained Slot-Hours' : slotsLabel}
              </span>
              <input
                data-testid="remained-slot-hours"
                type="text"
                inputMode="decimal"
                value={
                  remainedPending?.field === 'slots'
                    ? remainedPending.displayValue
                    : String(
                        edition === 'enterprise'
                          ? displayedForRemained.enterpriseSlotHours || ''
                          : displayedForRemained.standardSlotHours || ''
                      )
                }
                onChange={(e) => {
                  const raw = e.target.value;
                  setRemainedPending({ field: 'slots', displayValue: raw });
                  const v = parseInput(raw) || 0;
                  const field = edition === 'enterprise' ? 'enterpriseSlotHours' : 'standardSlotHours';
                  commitRemained(field, v);
                }}
                onBlur={() => setRemainedPending(null)}
                className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 font-mono text-sm"
              />
            </label>
          )}
          {(scenario === null || scenario === 'C') && (
            <label className="block">
              <span className="text-xs text-neutral-600">
                {edition === 'enterprise' ? 'Standard Slot-Hours' : 'Enterprise Slot-Hours'}
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={
                  remainedPending?.field === 'otherSlots'
                    ? remainedPending.displayValue
                    : String(
                        edition === 'enterprise'
                          ? displayedForRemained.standardSlotHours || ''
                          : displayedForRemained.enterpriseSlotHours || ''
                      )
                }
                onChange={(e) => {
                  const raw = e.target.value;
                  setRemainedPending({ field: 'otherSlots', displayValue: raw });
                  const v = parseInput(raw) || 0;
                  const field = edition === 'enterprise' ? 'standardSlotHours' : 'enterpriseSlotHours';
                  commitRemained(field, v);
                }}
                onBlur={() => setRemainedPending(null)}
                className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 font-mono text-sm"
              />
            </label>
          )}

          <div className="border-t border-violet-200 my-3" aria-hidden />

          {/* Yuki's (from optimized, not affected by slider) — only show the "moved to" side per scenario */}
          {showNewOd && (scenario === null || scenario !== 'A') && (
            <label className="block">
              <span className="text-xs text-neutral-600">Yuki&apos;s on-demand TiB</span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={optimized.onDemandTiB || ''}
                onChange={(e) =>
                  onOptimizedChange({ ...optimized, onDemandTiB: parseInput(e.target.value) || 0 })
                }
                className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 font-mono text-sm"
              />
            </label>
          )}
          {showNewSlots && (scenario === null || scenario === 'A') && (
            <label className="block">
              <span className="text-xs text-neutral-600">Yuki&apos;s Slot-Hours</span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={edition === 'enterprise' ? optimized.enterpriseSlotHours || '' : optimized.standardSlotHours || ''}
                onChange={(e) => {
                  const v = parseInput(e.target.value) || 0;
                  edition === 'enterprise'
                    ? onOptimizedChange({ ...optimized, enterpriseSlotHours: v })
                    : onOptimizedChange({ ...optimized, standardSlotHours: v });
                }}
                className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 font-mono text-sm"
              />
            </label>
          )}
          {showNewSlots && (scenario === null || scenario === 'C') && (
            <>
              <label className="block">
                <span className="text-xs text-neutral-600">Yuki&apos;s {slotsLabel}</span>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={edition === 'enterprise' ? optimized.enterpriseSlotHours || '' : optimized.standardSlotHours || ''}
                  onChange={(e) => {
                    const v = parseInput(e.target.value) || 0;
                    edition === 'enterprise'
                      ? onOptimizedChange({ ...optimized, enterpriseSlotHours: v })
                      : onOptimizedChange({ ...optimized, standardSlotHours: v });
                  }}
                  className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 font-mono text-sm"
                />
              </label>
              <label className="block">
                <span className="text-xs text-neutral-600">
                  Yuki&apos;s {edition === 'enterprise' ? 'Standard' : 'Enterprise'} Slot-Hours
                </span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={edition === 'enterprise' ? optimized.standardSlotHours || '' : optimized.enterpriseSlotHours || ''}
                onChange={(e) => {
                  const v = parseInput(e.target.value) || 0;
                  edition === 'enterprise'
                    ? onOptimizedChange({ ...optimized, standardSlotHours: v })
                    : onOptimizedChange({ ...optimized, enterpriseSlotHours: v });
                }}
                className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 font-mono text-sm"
              />
            </label>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
