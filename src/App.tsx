import { useState, useMemo, useCallback, useRef } from 'react';
import type { UsageState } from './lib/pricing';
import {
  computeMetrics,
  totalGoogleCost,
  defaultPricingConfig,
  getTibPerSlotRatio,
} from './lib/pricing';
import type { PricingConfig } from './lib/pricing';
import { KPICards } from './components/KPICards';
import { ComparisonChart } from './components/ComparisonChart';
import { EfficiencyGauge } from './components/EfficiencyGauge';
import { OriginalShiftedPanel } from './components/OriginalShiftedPanel';
import { Sidebar, type Edition, type Scenario } from './components/Sidebar';
import { lerpUsage, effectiveDisplayedForScenarioA, effectiveDisplayedForScenarioB } from './lib/calc';

const defaultOriginal: UsageState = {
  onDemandTiB: 0,
  enterpriseSlotHours: 0,
  standardSlotHours: 0,
};

const defaultOptimized: UsageState = {
  onDemandTiB: 0,
  enterpriseSlotHours: 0,
  standardSlotHours: 0,
};

export default function App() {
  const [original, setOriginal] = useState<UsageState>(defaultOriginal);
  const [optimized, setOptimized] = useState<UsageState>(defaultOptimized);
  const [config, setConfig] = useState<PricingConfig>(defaultPricingConfig);
  const [queriesMovedPct, setQueriesMovedPctState] = useState(60);
  const lastPctRef = useRef(60);
  const setQueriesMovedPct = useCallback((next: number) => {
    try {
      if (Math.abs(next - lastPctRef.current) < 0.0001) return;
      lastPctRef.current = next;
      setQueriesMovedPctState(next);
    } catch (_) {
      // guard against update loops
    }
  }, []);

  const [edition, setEdition] = useState<Edition>('standard');
  const [scenario, setScenario] = useState<Scenario | null>(null);

  const displayedOptimized = useMemo(
    () => lerpUsage(original, optimized, queriesMovedPct / 100),
    [original, optimized, queriesMovedPct]
  );

  // For cost and metrics use: Remained + Yuki per scenario.
  // A (OD→Slots): slider = remained % → remained OD = original.onDemandTiB * (pct/100). B: remained slots = original * (pct/100). C/null: lerp.
  const effectiveDisplayed = useMemo((): UsageState => {
    if (scenario === 'A') {
      return effectiveDisplayedForScenarioA(original, optimized, queriesMovedPct);
    }
    if (scenario === 'B') {
      const tibPerSlotRatio = getTibPerSlotRatio(config, edition === 'enterprise');
      return effectiveDisplayedForScenarioB(original, optimized, queriesMovedPct, tibPerSlotRatio);
    }
    return displayedOptimized;
  }, [
    scenario,
    original,
    optimized,
    queriesMovedPct,
    config,
    edition,
    displayedOptimized,
  ]);

  const metrics = useMemo(
    () =>
      computeMetrics(original, effectiveDisplayed, config, scenario === 'B' ? { equivOdTiB: optimized.onDemandTiB } : undefined),
    [original, effectiveDisplayed, config, scenario, optimized.onDemandTiB]
  );

  const chartData = useMemo(() => {
    const beforeBq = totalGoogleCost(original, config);
    const afterBq = totalGoogleCost(effectiveDisplayed, config);
    const withYukiBq = scenario === 'B' ? metrics.newTotalCost : afterBq;
    return [
      {
        name: 'Original (customer)',
        'BigQuery Cost': beforeBq,
        'Yuki Fee': 0,
        total: beforeBq,
      },
      {
        name: 'With Yuki',
        'BigQuery Cost': withYukiBq,
        'Yuki Fee': metrics.yukiFeeUSD,
        total: withYukiBq + metrics.yukiFeeUSD,
      },
    ];
  }, [original, effectiveDisplayed, config, scenario, metrics.newTotalCost, metrics.yukiFeeUSD]);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-neutral-100">
      <Sidebar
        original={original}
        optimized={optimized}
        displayedForRemained={effectiveDisplayed}
        config={config}
        queriesMovedPct={queriesMovedPct}
        edition={edition}
        scenario={scenario}
        onOriginalChange={setOriginal}
        onOptimizedChange={setOptimized}
        onConfigChange={setConfig}
        onQueriesMovedPctChange={setQueriesMovedPct}
        onEditionChange={setEdition}
        onScenarioChange={setScenario}
      />
      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
            Yuki BigQuery Pricing & Savings
          </h1>
          <p className="text-neutral-600 mt-1 text-sm">
            Visualize the shift from BigQuery on-demand to Reservations (and vice-versa).
          </p>
        </header>

        <KPICards metrics={metrics} ycUsd={config.ycUsd} config={config} original={original} />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
          <div className="xl:col-span-2">
            <ComparisonChart data={chartData} />
          </div>
          <div>
            <EfficiencyGauge
              percent={metrics.yukiCapturePercent}
              yukiFeeUSD={metrics.yukiFeeUSD}
              grossSavings={metrics.grossSavings}
            />
          </div>
        </div>
        <div className="mt-6">
          <OriginalShiftedPanel
            original={original}
            displayed={effectiveDisplayed}
            scenario={scenario}
            chargeableYC={scenario === 'B' ? metrics.chargeableYC : undefined}
            config={config}
            edition={edition}
          />
        </div>
      </main>
    </div>
  );
}
