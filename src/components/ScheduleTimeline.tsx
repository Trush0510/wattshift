import type { BatteryAction, OptimisationResult } from '../lib/types';

interface ScheduleTimelineProps {
  result: OptimisationResult;
  isOptimised: boolean;
}

const ACTION_STYLES: Record<BatteryAction, { badge: string; ribbon: string; label: string }> = {
  charge: {
    badge: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30',
    ribbon: 'bg-emerald-500',
    label: 'Charge',
  },
  discharge: {
    badge: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',
    ribbon: 'bg-amber-500',
    label: 'Discharge',
  },
  hold: {
    badge: 'bg-slate-800 text-slate-300 ring-1 ring-slate-700',
    ribbon: 'bg-slate-700',
    label: 'Hold',
  },
};

export function ScheduleTimeline({ result, isOptimised }: ScheduleTimelineProps) {
  const rows = isOptimised ? result.optimised.hourly : result.baseline.hourly;

  return (
    <section
      aria-label="24-Hour Battery Schedule"
      className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"
    >
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">
            {isOptimised
              ? 'Optimised 24-Hour Battery Action Schedule'
              : '24-Hour Forecast & Baseline Preview'}
          </h3>
          <p className="text-xs text-slate-400">
            {isOptimised
              ? '24 hourly Charge, Discharge, and Hold decisions respecting inverter and reserve limits.'
              : 'Showing 24 hourly forecast points. Click Optimise My Energy to generate the cost-minimised schedule.'}
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1.5 text-emerald-300">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Charge
          </span>
          <span className="inline-flex items-center gap-1.5 text-amber-300">
            <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" /> Discharge
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-400">
            <span className="h-2.5 w-2.5 rounded-sm bg-slate-700" /> Hold
          </span>
        </div>
      </div>

      {/* 24-block action ribbon */}
      <div
        className="mb-4 grid grid-cols-12 gap-1 sm:grid-cols-24"
        data-testid="schedule-action-ribbon"
      >
        {rows.map((h) => {
          const style = ACTION_STYLES[h.action];
          return (
            <div
              key={h.hour}
              title={`${h.label}: ${style.label} (${h.netBatteryKw >= 0 ? '+' : ''}${h.netBatteryKw.toFixed(2)} kW)`}
              className="flex flex-col items-center gap-1"
            >
              <div className={`h-6 w-full rounded ${style.ribbon}`} />
              <span className="text-[10px] text-slate-400">{String(h.hour).padStart(2, '0')}</span>
            </div>
          );
        })}
      </div>

      <div className="max-h-72 overflow-x-auto overflow-y-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-slate-950 text-slate-400">
            <tr>
              <th className="px-3 py-2 font-medium">Hour</th>
              <th className="px-3 py-2 font-medium">Action</th>
              <th className="px-3 py-2 font-medium">Solar (kW)</th>
              <th className="px-3 py-2 font-medium">Demand (kW)</th>
              <th className="px-3 py-2 font-medium">Battery (kW)</th>
              <th className="px-3 py-2 font-medium">Import (p/kWh)</th>
              <th className="px-3 py-2 font-medium">End SoC</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {rows.map((h) => {
              const style = ACTION_STYLES[h.action];
              return (
                <tr key={h.hour} data-testid={`schedule-row-${h.hour}`} className="hover:bg-slate-800/40">
                  <td className="px-3 py-1.5 font-mono text-slate-200">{h.label}</td>
                  <td className="px-3 py-1.5">
                    <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-medium ${style.badge}`}>
                      {style.label}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-amber-300">{h.solarKw.toFixed(2)}</td>
                  <td className="px-3 py-1.5 text-sky-300">{h.demandKw.toFixed(2)}</td>
                  <td className="px-3 py-1.5 font-mono text-slate-200">
                    {h.netBatteryKw > 0
                      ? `+${h.netBatteryKw.toFixed(2)}`
                      : h.netBatteryKw.toFixed(2)}
                  </td>
                  <td className="px-3 py-1.5 text-slate-300">{h.importPricePence.toFixed(1)}p</td>
                  <td className="px-3 py-1.5 text-slate-200">
                    {h.socEndPct.toFixed(0)}% ({h.socEndKwh.toFixed(1)} kWh)
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
