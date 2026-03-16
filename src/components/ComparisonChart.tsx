import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  LabelList,
} from 'recharts';

interface ChartRow {
  name: string;
  'BigQuery Cost': number;
  'Yuki Fee': number;
  total: number;
}

const COLORS = {
  'BigQuery Cost': '#94a3b8',
  'Yuki Fee': '#6d28d9',
};

function fmtUSD(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatLabel(v: unknown): string {
  return fmtUSD(Number(v ?? 0));
}

function yAxisFormatter(v: number): string {
  return `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`;
}

export function ComparisonChart({ data }: { data: ChartRow[] }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white shadow-sm p-4 pb-8 mb-6">
      <h3 className="text-sm font-semibold text-neutral-600 mb-4">
        Total cost — inc. Yuki&apos;s fee
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={data}
          margin={{ top: 24, right: 16, left: 0, bottom: 8 }}
          barGap={8}
          barCategoryGap="30%"
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200" />
          <XAxis
            dataKey="name"
            tick={{ fill: 'currentColor', fontSize: 12 }}
            className="text-neutral-600"
          />
          <YAxis
            tickFormatter={yAxisFormatter}
            tick={{ fill: 'currentColor', fontSize: 11 }}
            className="text-neutral-600"
          />
          <Legend />
          <Bar dataKey="BigQuery Cost" stackId="a" fill={COLORS['BigQuery Cost']} name="BigQuery Cost">
            <LabelList dataKey="BigQuery Cost" position="center" formatter={formatLabel} style={{ fill: 'white', fontSize: 10 }} />
          </Bar>
          <Bar dataKey="Yuki Fee" stackId="a" fill={COLORS['Yuki Fee']} name="Yuki (fee)">
            <LabelList dataKey="Yuki Fee" position="center" formatter={formatLabel} style={{ fill: 'white', fontSize: 10 }} />
            <LabelList dataKey="total" position="top" formatter={formatLabel} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
