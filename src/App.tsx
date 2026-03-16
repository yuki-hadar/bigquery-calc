import { useState, useMemo } from 'react';
import type { UsageState } from './lib/pricing';
import {
  computeMetrics,
  totalGoogleCost,
  defaultPricingConfig,
} from './lib/pricing';
import type { PricingConfig } from './lib/pricing';
import { KPICards } from './components/KPICards';
import { ComparisonChart } from './components/ComparisonChart';
import { EfficiencyGauge } from './components/EfficiencyGauge';
import { OriginalShiftedPanel } from './components/OriginalShiftedPanel';
import { Sidebar, type Edition, type Scenario } from './components/Sidebar';

function lerpUsage(from: UsageState, to: UsageState, t: number): UsageState {
  return {
    onDemandTiB: from.onDemandTiB + (to.onDemandTiB - from.onDemandTiB) * t,
    enterpriseSlotHours: from.enterpriseSlotHours + (to.enterpriseSlotHours - from.enterpriseSlotHours) * t,
    standardSlotHours: from.standardSlotHours + (to.standardSlotHours - from.standardSlotHours) * t,
  };
}

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
  const [queriesMovedPct, setQueriesMovedPct] = useState(60);
  const [edition, setEdition] = useState<Edition>('standard');
  const [scenario, setScenario] = useState<Scenario>('A');

  const displayedOptimized = useMemo(
    () => lerpUsage(original, optimized, queriesMovedPct / 100),
    [original, optimized, queriesMovedPct]
  );

  const metrics = useMemo(
    () => computeMetrics(original, displayedOptimized, config),
    [original, displayedOptimized, config]
  );

  const chartData = useMemo(() => {
    const beforeBq = totalGoogleCost(original, config);
    const afterBq = totalGoogleCost(displayedOptimized, config);
    return [
      {
        name: 'Original (customer)',
        'BigQuery Cost': beforeBq,
        'Yuki Fee': 0,
        total: beforeBq,
      },
      {
        name: 'With Yuki',
        'BigQuery Cost': afterBq,
        'Yuki Fee': metrics.yukiFeeUSD,
        total: afterBq + metrics.yukiFeeUSD,
      },
    ];
  }, [original, displayedOptimized, config, metrics.yukiFeeUSD]);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-neutral-100">
      <Sidebar
        original={original}
        optimized={optimized}
        displayedOptimized={displayedOptimized}
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
            Visualize the shift from BigQuery On-Demand to Reservations (and vice-versa) using Yuki Credit (YC). 1 YC = ${config.ycUsd.toFixed(2)} USD.
          </p>
        </header>

        <KPICards metrics={metrics} ycUsd={config.ycUsd} />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
          <div className="xl:col-span-2">
            <ComparisonChart data={chartData} />
          </div>
          <div>
            <EfficiencyGauge percent={metrics.yukiCapturePercent} />
          </div>
        </div>
        <div className="mt-6">
          <OriginalShiftedPanel original={original} displayed={displayedOptimized} />
        </div>
      </main>
    </div>
  );
}
