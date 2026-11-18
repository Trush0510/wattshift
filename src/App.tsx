import { BatterySocChart } from './components/BatterySocChart';
import { ConfigPanel } from './components/ConfigPanel';
import { EnergyFlowChart } from './components/EnergyFlowChart';
import { ExplanationCard } from './components/ExplanationCard';
import { HeaderBanner } from './components/HeaderBanner';
import { KpiSummaryCards } from './components/KpiSummaryCards';
import { ScheduleTimeline } from './components/ScheduleTimeline';
import { TariffChart } from './components/TariffChart';
import { TimeMachineBar } from './components/TimeMachineBar';
import { useEnergyAutopilot } from './hooks/useEnergyAutopilot';

export default function App() {
  const {
    config,
    scenario,
    isOptimised,
    errors,
    hasErrors,
    result,
    explanation,
    isExplaining,
    updateConfigField,
    selectScenario,
    optimiseEnergy,
    resetDemo,
    requestExplanation,
  } = useEnergyAutopilot();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <HeaderBanner config={config} isOptimised={isOptimised} />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-3">
            <ConfigPanel config={config} errors={errors} onFieldChange={updateConfigField} />
          </div>

          <div className="min-w-0 space-y-6 lg:col-span-9">
            <TimeMachineBar
              scenario={scenario}
              isOptimised={isOptimised}
              isExplaining={isExplaining}
              hasErrors={hasErrors}
              onOptimise={optimiseEnergy}
              onSelectScenario={selectScenario}
              onExplain={requestExplanation}
              onReset={resetDemo}
            />

            <KpiSummaryCards result={result} isOptimised={isOptimised} />

            <ExplanationCard explanation={explanation} isExplaining={isExplaining} />

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <EnergyFlowChart result={result} isOptimised={isOptimised} />
              <BatterySocChart result={result} isOptimised={isOptimised} />
            </div>

            <TariffChart result={result} />

            <ScheduleTimeline result={result} isOptimised={isOptimised} />
          </div>
        </div>
      </main>
    </div>
  );
}
