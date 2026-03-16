import type { DashboardMetrics } from '../lib/pricing';

function fmtUSD(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtNum(n: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export function KPICards({ metrics, ycUsd }: { metrics: DashboardMetrics; ycUsd: number }) {
  const cards = [
    {
      label: 'Total Original Cost',
      value: fmtUSD(metrics.totalOriginalCost),
      sub: 'Before Yuki',
    },
    {
      label: 'New Total Cost',
      value: fmtUSD(metrics.newTotalCost),
      sub: 'BigQuery cost after optimization',
    },
    {
      label: 'Gross Savings',
      value: fmtUSD(metrics.grossSavings),
      sub: metrics.grossSavings >= 0 ? 'Reduction in BigQuery spend' : 'Increase in BigQuery spend',
    },
    {
      label: 'Yuki Fee',
      value: `${fmtUSD(metrics.yukiFeeUSD)} (${fmtNum(metrics.chargeableYC)} YC)`,
      sub: `Chargeable units × $${ycUsd.toFixed(2)}`,
    },
    {
      label: 'Customer Net Savings',
      value: fmtUSD(metrics.customerNetSavings),
      sub: 'Gross savings − Yuki fee',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-xl border border-neutral-200 bg-white shadow-sm p-4"
        >
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
            {c.label}
          </p>
          <p className="mt-1 text-lg font-semibold text-neutral-900 font-mono">
            {c.value}
          </p>
          <p className="mt-0.5 text-xs text-neutral-500">{c.sub}</p>
        </div>
      ))}
    </div>
  );
}
