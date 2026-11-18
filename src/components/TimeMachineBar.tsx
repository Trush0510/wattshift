import { CloudRain, RotateCcw, Sparkles, Sun, Zap, TrendingUp } from 'lucide-react';
import { SCENARIO_META } from '../lib/scenarios';
import type { ScenarioId } from '../lib/types';

interface TimeMachineBarProps {
  scenario: ScenarioId;
  isOptimised: boolean;
  isExplaining: boolean;
  hasErrors: boolean;
  onOptimise: () => void;
  onSelectScenario: (scenario: ScenarioId) => void;
  onExplain: () => void;
  onReset: () => void;
}

export function TimeMachineBar({
  scenario,
  isOptimised,
  isExplaining,
  hasErrors,
  onOptimise,
  onSelectScenario,
  onExplain,
  onReset,
}: TimeMachineBarProps) {
  return (
    <section
      aria-label="Energy Time Machine and Actions"
      className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onOptimise}
            disabled={hasErrors}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
              isOptimised
                ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                : 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-400/50 hover:bg-emerald-400'
            }`}
          >
            <Zap className="h-4 w-4" />
            <span>Optimise My Energy</span>
          </button>

          <button
            type="button"
            onClick={onExplain}
            disabled={hasErrors || isExplaining}
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-500/15 px-4 py-2.5 text-sm font-semibold text-indigo-200 transition hover:bg-indigo-500/25 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4 text-indigo-300" />
            <span>{isExplaining ? 'Explaining Plan…' : 'Explain My Plan'}</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/70 px-3.5 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800 cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset Demo</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Energy Time Machine:
          </span>

          <button
            type="button"
            onClick={() => onSelectScenario('standard')}
            aria-pressed={scenario === 'standard'}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
              scenario === 'standard'
                ? 'bg-amber-500/20 text-amber-200 ring-1 ring-amber-500/50'
                : 'border border-slate-700 bg-slate-950/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Sun className="h-3.5 w-3.5" />
            <span>Standard Day</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectScenario('cloudy')}
            aria-pressed={scenario === 'cloudy'}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
              scenario === 'cloudy'
                ? 'bg-sky-500/20 text-sky-200 ring-1 ring-sky-500/50'
                : 'border border-slate-700 bg-slate-950/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <CloudRain className="h-3.5 w-3.5" />
            <span>Cloudy Weather</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectScenario('price_spike')}
            aria-pressed={scenario === 'price_spike'}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
              scenario === 'price_spike'
                ? 'bg-rose-500/20 text-rose-200 ring-1 ring-rose-500/50'
                : 'border border-slate-700 bg-slate-950/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Price Spike</span>
          </button>
        </div>
      </div>

      <p className="mt-2.5 text-xs text-slate-400">
        <strong className="text-slate-300">{SCENARIO_META[scenario].label}:</strong>{' '}
        {SCENARIO_META[scenario].description}
      </p>
    </section>
  );
}
