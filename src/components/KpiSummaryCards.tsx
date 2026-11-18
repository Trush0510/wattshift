import type { OptimisationResult } from '../lib/types';

interface KpiSummaryCardsProps {
  result: OptimisationResult;
  isOptimised: boolean;
}

function formatGbp(amount: number): string {
  return amount < 0 ? `-£${Math.abs(amount).toFixed(2)}` : `£${amount.toFixed(2)}`;
}

export function KpiSummaryCards({ result, isOptimised }: KpiSummaryCardsProps) {
  const startPct = ((result.baseline.startSocKwh / result.config.batteryCapacityKwh) * 100).toFixed(0);
  const endPct = ((result.baseline.endSocKwh / result.config.batteryCapacityKwh) * 100).toFixed(0);

  return (
    <section aria-label="Financial and Energy Summary" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4" data-testid="kpi-baseline-cost">
        <p className="text-xs font-medium text-slate-400">Baseline 24h Cost</p>
        <p className="mt-1 text-2xl font-bold text-white">
          {formatGbp(result.baseline.totalCostGbp)}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Import {result.baseline.totalImportKwh} kWh · Export {result.baseline.totalExportKwh} kWh
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4" data-testid="kpi-optimised-cost">
        <p className="text-xs font-medium text-slate-400">Optimised 24h Cost</p>
        {isOptimised ? (
          <>
            <p className="mt-1 text-2xl font-bold text-emerald-400">
              {formatGbp(result.optimised.totalCostGbp)}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Import {result.optimised.totalImportKwh} kWh · Export {result.optimised.totalExportKwh} kWh
            </p>
          </>
        ) : (
          <>
            <p className="mt-1 text-lg font-semibold text-slate-300">Ready to calculate</p>
            <p className="mt-1 text-xs text-slate-400">
              Click <strong>Optimise My Energy</strong> to generate schedule
            </p>
          </>
        )}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4" data-testid="kpi-savings">
        <p className="text-xs font-medium text-slate-400">Estimated Daily Savings</p>
        {isOptimised ? (
          <>
            <p className="mt-1 text-2xl font-bold text-amber-400">
              {formatGbp(result.savingsGbp)}{' '}
              {result.baseline.totalCostGbp > 0 && (
                <span className="text-sm font-medium text-amber-300/80">
                  ({result.savingsPct}%)
                </span>
              )}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Baseline − Optimised (Simulated Estimate)
            </p>
          </>
        ) : (
          <>
            <p className="mt-1 text-lg font-semibold text-slate-300">—</p>
            <p className="mt-1 text-xs text-slate-400">
              Calculated from comparable start/end battery SoC
            </p>
          </>
        )}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4" data-testid="kpi-solar-forecast">
        <p className="text-xs font-medium text-slate-400">24h Solar & Demand</p>
        <p className="mt-1 text-2xl font-bold text-sky-400">
          {result.baseline.totalSolarKwh} <span className="text-sm font-normal text-slate-400">kWh solar</span>
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Demand {result.baseline.totalDemandKwh} kWh · SoC {startPct}% → {endPct}%
        </p>
      </div>
    </section>
  );
}
