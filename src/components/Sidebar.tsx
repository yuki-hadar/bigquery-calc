import type { UsageState } from '../lib/pricing';
import type { PricingConfig } from '../lib/pricing';

export type Edition = 'standard' | 'enterprise';
export type Scenario = 'A' | 'B' | 'C';

interface SidebarProps {
  original: UsageState;
  optimized: UsageState;
  displayedOptimized: UsageState;
  config: PricingConfig;
  queriesMovedPct: number;
  edition: Edition;
  scenario: Scenario;
  onOriginalChange: (s: UsageState) => void;
  onOptimizedChange: (s: UsageState) => void;
  onConfigChange: (c: PricingConfig) => void;
  onQueriesMovedPctChange: (pct: number) => void;
  onEditionChange: (e: Edition) => void;
  onScenarioChange: (s: Scenario) => void;
}

function parseInput(s: string): number {
  const v = s.replace(/[,\s]/g, '').replace(/[mM]$/, '000000').replace(/[kK]$/, '000');
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

function impliedPct(
  original: UsageState,
  optimized: UsageState,
  field: 'onDemandTiB' | 'standardSlotHours' | 'enterpriseSlotHours',
  newValue: number
): number {
  const orig = original[field];
  const opt = optimized[field];
  if (opt === orig) return 100;
  const t = (newValue - orig) / (opt - orig);
  return Math.round(Math.min(100, Math.max(0, t * 100)));
}

export function Sidebar({
  original,
  optimized,
  displayedOptimized,
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

  const handleNewOdChange = (value: number) => {
    const pct = impliedPct(original, optimized, 'onDemandTiB', value);
    onQueriesMovedPctChange(pct);
  };
  const handleNewStdSlotsChange = (value: number) => {
    const pct = impliedPct(original, optimized, 'standardSlotHours', value);
    onQueriesMovedPctChange(pct);
  };
  const handleNewEntSlotsChange = (value: number) => {
    const pct = impliedPct(original, optimized, 'enterpriseSlotHours', value);
    onQueriesMovedPctChange(pct);
  };

  const showOriginalOd = scenario === 'A' || scenario === 'C';
  const showOriginalSlots = scenario === 'B' || scenario === 'C';
  const showNewOd = scenario === 'A' || scenario === 'B' || scenario === 'C';
  const showNewSlots = scenario === 'A' || scenario === 'B' || scenario === 'C';
  const slotsLabel = edition === 'enterprise' ? 'Enterprise Slot-Hours' : 'Standard Slot-Hours';

  return (
    <aside className="w-full lg:w-80 shrink-0 border-b lg:border-b-0 lg:border-r border-neutral-200 bg-neutral-50 p-5 lg:p-6 flex flex-col gap-6 overflow-y-auto">
      <div>
        <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
          Scenario
        </h2>
        <div className="flex gap-2">
          {(['A', 'B', 'C'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                onScenarioChange(s);
                const cfg = scenarioConfigs[s];
                onOriginalChange(cfg.original);
                onOptimizedChange(cfg.optimized);
              }}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                scenario === s
                  ? 'bg-violet-200 text-violet-900 border border-violet-300'
                  : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300 border border-transparent'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <p className="text-xs text-neutral-500 mt-1">
          A: OD→Slots · B: Slots→OD · C: Hybrid
        </p>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
          Pricing constants
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs text-neutral-600">YC (1 YC = $)</span>
            <input
              type="number"
              min={0}
              step={0.5}
              value={config.ycUsd}
              onChange={(e) => updateConfig('ycUsd', parseFloat(e.target.value) || 0)}
              className="mt-0.5 w-full rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-neutral-900 font-mono text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs text-neutral-600">On-Demand $/TiB</span>
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
              <span className="text-xs text-neutral-600">Original On-Demand TiB</span>
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
          {scenario === 'C' && (
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
          Queries moved (%)
        </h2>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={100}
            value={queriesMovedPct}
            onChange={(e) => onQueriesMovedPctChange(Number(e.target.value))}
            className="flex-1 h-2 rounded-lg appearance-none bg-neutral-200 accent-violet-600"
          />
          <span className="text-sm font-mono text-neutral-800 w-10">{queriesMovedPct}%</span>
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
          Existing + Yuki (optimized state)
        </h2>
        <div className="space-y-4">
          {showNewOd && (
            <label className="block">
              <span className="text-xs text-neutral-600">
                {scenario === 'B' ? "Yuki's On-Demand TiB" : 'Existing On-Demand TiB'}
              </span>
              <input
                type="number"
                min={0}
                step={100}
                value={Math.round(displayedOptimized.onDemandTiB) || ''}
                onChange={(e) => handleNewOdChange(parseInput(e.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 font-mono text-sm"
              />
            </label>
          )}
          {showNewSlots && (
            <label className="block">
              <span className="text-xs text-neutral-600">
                {scenario === 'A' ? "Yuki's Slot-Hours" : scenario === 'B' ? 'Existing Slot-Hours' : 'Slot-Hours'}
              </span>
              <input
                type="number"
                min={0}
                step={10000}
                value={
                  Math.round(
                    edition === 'enterprise'
                      ? displayedOptimized.enterpriseSlotHours
                      : displayedOptimized.standardSlotHours
                  ) || ''
                }
                onChange={(e) => {
                  const v = parseInput(e.target.value) || 0;
                  edition === 'enterprise' ? handleNewEntSlotsChange(v) : handleNewStdSlotsChange(v);
                }}
                className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 font-mono text-sm"
              />
            </label>
          )}
          {scenario === 'C' && (
            <label className="block">
              <span className="text-xs text-neutral-600">
                {edition === 'enterprise' ? 'Standard Slot-Hours' : 'Enterprise Slot-Hours'}
              </span>
              <input
                type="number"
                min={0}
                step={10000}
                value={
                  Math.round(
                    edition === 'enterprise'
                      ? displayedOptimized.standardSlotHours
                      : displayedOptimized.enterpriseSlotHours
                  ) || ''
                }
                onChange={(e) => {
                  const v = parseInput(e.target.value) || 0;
                  edition === 'enterprise' ? handleNewStdSlotsChange(v) : handleNewEntSlotsChange(v);
                }}
                className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 font-mono text-sm"
              />
            </label>
          )}
        </div>
      </div>
    </aside>
  );
}
