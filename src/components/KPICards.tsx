import type { DashboardMetrics, PricingConfig, UsageState } from '../lib/pricing';
import { costOnDemand, costStandardSlots, costEnterpriseSlots } from '../lib/pricing';

function fmtUSD(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtYC(n: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function fmtQty(n: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 4,
  }).format(n);
}

function fmtSlotHours(n: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}

type Card = {
  label: string;
  value: string;
  valueLine2?: string;
  sub: string;
};

export function KPICards({
  metrics,
  ycUsd,
  config,
  original,
}: {
  metrics: DashboardMetrics;
  ycUsd: number;
  config: PricingConfig;
  original: UsageState;
}) {
  const b = metrics.newTotalBreakdown;
  const origOdCost = costOnDemand(original.onDemandTiB, config);
  const origStdCost = costStandardSlots(original.standardSlotHours, config);
  const origEntCost = costEnterpriseSlots(original.enterpriseSlotHours, config);
  const cards: Card[] = [
    {
      label: 'Total Original Cost',
      value: fmtUSD(metrics.totalOriginalCost),
      sub: 'Before Yuki',
    },
    {
      label: 'New Total Cost',
      value: fmtUSD(metrics.newTotalCost),
      sub: '',
    },
    {
      label: 'Gross Savings',
      value: fmtUSD(metrics.grossSavings),
      sub: metrics.grossSavings >= 0 ? 'Reduction in BigQuery spend' : 'Increase in BigQuery spend',
    },
    {
      label: 'Yuki Fee',
      value: fmtUSD(metrics.yukiFeeUSD),
      valueLine2: `${fmtYC(metrics.chargeableYC)} Yuki Credits × $${ycUsd.toFixed(2)}`,
      sub: `Chargeable units × $${ycUsd.toFixed(2)}`,
    },
    {
      label: 'Customer Net Savings (ROI)',
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
          {c.valueLine2 && (
            <p className="mt-0.5 text-sm text-neutral-600 font-mono">{c.valueLine2}</p>
          )}
          {c.label === 'Total Original Cost' ? (
            <>
              <div className="mt-1.5 space-y-1 text-xs text-neutral-600 leading-snug">
                <p>
                  On-demand TiB: {fmtQty(original.onDemandTiB)} × ${config.onDemandTiBPrice}/TiB ={' '}
                  <span className="font-mono text-neutral-800">{fmtUSD(origOdCost)}</span>
                </p>
                {original.standardSlotHours > 0 && (
                  <p>
                    Standard reservation slot hours: {fmtSlotHours(original.standardSlotHours)} × $
                    {config.standardSlotPrice}/hr ={' '}
                    <span className="font-mono text-neutral-800">{fmtUSD(origStdCost)}</span>
                  </p>
                )}
                {original.enterpriseSlotHours > 0 && (
                  <p>
                    Enterprise reservation slot hours: {fmtSlotHours(original.enterpriseSlotHours)} × $
                    {config.enterpriseSlotPrice}/hr ={' '}
                    <span className="font-mono text-neutral-800">{fmtUSD(origEntCost)}</span>
                  </p>
                )}
              </div>
              <p className="mt-1.5 text-xs text-neutral-500">{c.sub}</p>
            </>
          ) : c.label === 'New Total Cost' ? (
            <div className="mt-1.5 space-y-1 text-xs text-neutral-600 leading-snug">
              <p>
                On-demand TiB: {fmtQty(b.onDemandTiB)} × ${config.onDemandTiBPrice}/TiB ={' '}
                <span className="font-mono text-neutral-800">{fmtUSD(b.costOnDemandUSD)}</span>
              </p>
              {b.standardSlotHours > 0 && (
                <p>
                  Standard reservation slot hours: {fmtSlotHours(b.standardSlotHours)} × $
                  {config.standardSlotPrice}/hr ={' '}
                  <span className="font-mono text-neutral-800">{fmtUSD(b.costStandardSlotsUSD)}</span>
                </p>
              )}
              {b.enterpriseSlotHours > 0 && (
                <p>
                  Enterprise reservation slot hours: {fmtSlotHours(b.enterpriseSlotHours)} × $
                  {config.enterpriseSlotPrice}/hr ={' '}
                  <span className="font-mono text-neutral-800">{fmtUSD(b.costEnterpriseSlotsUSD)}</span>
                </p>
              )}
            </div>
          ) : (
            <p className="mt-0.5 text-xs text-neutral-500">{c.sub}</p>
          )}
        </div>
      ))}
    </div>
  );
}
