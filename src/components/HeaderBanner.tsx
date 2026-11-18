import { ShieldAlert, Sun } from 'lucide-react';
import type { SystemConfig } from '../lib/types';

interface HeaderBannerProps {
  config: SystemConfig;
  isOptimised: boolean;
}

export function HeaderBanner({ config, isOptimised }: HeaderBannerProps) {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30">
            <Sun className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
                SolarXchange
              </h1>
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-300 ring-1 ring-emerald-500/30">
                AI Energy Autopilot
              </span>
            </div>
            <p className="text-xs text-slate-400 sm:text-sm">
              UK Homeowner Demo ·{' '}
              {Number.isFinite(config.solarCapacityKwp) && config.solarCapacityKwp > 0
                ? `${config.solarCapacityKwp.toFixed(1)} kWp Solar`
                : '— kWp Solar'}{' '}
              ·{' '}
              {Number.isFinite(config.batteryCapacityKwh) && config.batteryCapacityKwh > 0
                ? `${config.batteryCapacityKwh.toFixed(1)} kWh Battery`
                : '— kWh Battery'}{' '}
              ·{' '}
              <span className="text-slate-300">
                {isOptimised ? 'Optimised Schedule Active' : '24h Forecast Mode'}
              </span>
            </p>
          </div>
        </div>

        <div
          className="inline-flex items-center gap-2 self-start rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-200 sm:self-auto"
          data-testid="simulated-estimates-badge"
        >
          <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400" />
          <span>
            <strong>Simulated Estimates</strong> — Decision support only, not guaranteed savings
          </span>
        </div>
      </div>
    </header>
  );
}
