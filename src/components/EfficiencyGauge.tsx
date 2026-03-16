const TARGET_PERCENT = 32;
const GAUGE_SIZE = 140;
const STROKE = 10;
const R = (GAUGE_SIZE - STROKE) / 2;
const CX = GAUGE_SIZE / 2;
const CY = GAUGE_SIZE / 2;
const circumference = 2 * Math.PI * R;

export function EfficiencyGauge({ percent }: { percent: number }) {
  const clamped = Math.min(100, Math.max(0, percent));
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white shadow-sm p-4 flex flex-col items-center">
      <h3 className="text-sm font-semibold text-neutral-600 mb-2 w-full text-center">
        Yuki savings capture
      </h3>
      <p className="text-xs text-neutral-500 mb-4">
        Target: ~{TARGET_PERCENT}%
      </p>
      <svg width={GAUGE_SIZE} height={GAUGE_SIZE} className="overflow-visible">
        <circle
          cx={CX}
          cy={CY}
          r={R}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE}
          className="text-neutral-200"
        />
        <circle
          cx={CX}
          cy={CY}
          r={R}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${CX} ${CY})`}
          className="text-violet-600 transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <p className="mt-3 text-2xl font-bold text-neutral-900 font-mono">
        {percent.toFixed(1)}%
      </p>
      <p className="text-xs text-neutral-500">
        of gross savings
      </p>
    </div>
  );
}
