import { AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';
import type { ExplanationPayload } from '../lib/types';

interface ExplanationCardProps {
  explanation: ExplanationPayload | null;
  isExplaining: boolean;
}

export function ExplanationCard({ explanation, isExplaining }: ExplanationCardProps) {
  if (isExplaining) {
    return (
      <section
        aria-label="AI Plan Explanation"
        className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-5"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-indigo-200">
          <Sparkles className="h-4 w-4 animate-pulse text-indigo-400" />
          <span>Generating grounded explanation from your calculated 24-hour schedule…</span>
        </div>
      </section>
    );
  }

  if (!explanation) {
    return (
      <section
        aria-label="AI Plan Explanation"
        className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-5 text-sm text-slate-400"
      >
        Click <strong className="text-slate-200">Explain My Plan</strong> above to receive a
        grounded explanation of your battery schedule, tariff windows, and simulated savings.
      </section>
    );
  }

  const isOffline = explanation.source === 'offline-fallback';

  return (
    <section
      aria-label="AI Plan Explanation"
      data-testid="explanation-card"
      className={`rounded-2xl border p-5 ${
        isOffline
          ? 'border-amber-500/40 bg-amber-950/20'
          : 'border-indigo-500/40 bg-indigo-950/20'
      }`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-white">{explanation.headline}</h3>
        <span
          data-testid="explanation-source-badge"
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
            isOffline
              ? 'bg-amber-500/20 text-amber-200 ring-1 ring-amber-500/40'
              : 'bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-500/40'
          }`}
        >
          {isOffline ? (
            <>
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
              <span>Offline Explanation (Gemini API Unavailable)</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-indigo-300" />
              <span>Gemini AI Explanation</span>
            </>
          )}
        </span>
      </div>

      <p className="text-sm leading-relaxed text-slate-200">{explanation.overview}</p>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3.5">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Key Battery Decisions
          </h4>
          <ul className="space-y-1.5 text-xs text-slate-200">
            {explanation.actionHighlights.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2.5 rounded-xl border border-slate-800/80 bg-slate-950/60 p-3.5 text-xs text-slate-300">
          <div>
            <h4 className="mb-1 font-semibold uppercase tracking-wider text-slate-400">
              Financial Breakdown (Simulated Estimate)
            </h4>
            <p className="leading-relaxed">{explanation.financialBreakdown}</p>
          </div>
          <div className="border-t border-slate-800 pt-2">
            <h4 className="mb-1 font-semibold uppercase tracking-wider text-slate-400">
              Scenario Context
            </h4>
            <p className="leading-relaxed">{explanation.scenarioNote}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
