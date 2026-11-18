import { SCENARIO_META } from './scenarios';
import type { ExplanationPayload, HourlySchedulePoint, OptimisationResult } from './types';

function groupActionWindows(hourly: HourlySchedulePoint[]): string[] {
  const highlights: string[] = [];
  let i = 0;

  while (i < hourly.length) {
    const current = hourly[i];
    if (current.action === 'hold') {
      i++;
      continue;
    }

    const actionType = current.action;
    let j = i;
    let totalKwh = 0;
    let minPrice = current.importPricePence;
    let maxPrice = current.importPricePence;

    while (j < hourly.length && hourly[j].action === actionType) {
      totalKwh += actionType === 'charge' ? hourly[j].chargeKw : hourly[j].dischargeKw;
      minPrice = Math.min(minPrice, hourly[j].importPricePence);
      maxPrice = Math.max(maxPrice, hourly[j].importPricePence);
      j++;
    }

    const startLabel = hourly[i].label;
    const endHour = hourly[j - 1].hour + 1;
    const endLabel = `${String(endHour).padStart(2, '0')}:00`;
    const priceText =
      minPrice === maxPrice
        ? `${minPrice.toFixed(1)}p/kWh`
        : `${minPrice.toFixed(1)}–${maxPrice.toFixed(1)}p/kWh`;

    if (actionType === 'charge') {
      highlights.push(
        `Charge ${totalKwh.toFixed(1)} kWh between ${startLabel}–${endLabel} (import rate ${priceText})`,
      );
    } else {
      highlights.push(
        `Discharge ${totalKwh.toFixed(1)} kWh between ${startLabel}–${endLabel} to avoid ${priceText} grid import`,
      );
    }

    i = j;
  }

  if (highlights.length === 0) {
    highlights.push('Hold battery state across the 24-hour window as tariffs remain balanced.');
  }

  return highlights.slice(0, 4);
}

export function buildOfflineExplanation(
  result: OptimisationResult,
  reason = 'Gemini API unavailable',
): ExplanationPayload {
  const scenarioInfo = SCENARIO_META[result.scenario];
  const baseGbp = result.baseline.totalCostGbp.toFixed(2);
  const optGbp = result.optimised.totalCostGbp.toFixed(2);
  const savGbp = result.savingsGbp.toFixed(2);

  const headline =
    result.savingsGbp > 0
      ? `Save £${savGbp} today under ${scenarioInfo.label} by shifting battery use away from peak rates`
      : `Optimised schedule matches baseline cost (£${optGbp}) under ${scenarioInfo.label}`;

  const overview = `For your ${result.config.solarCapacityKwp} kWp solar and ${result.config.batteryCapacityKwh} kWh battery system (${scenarioInfo.label}), the 24-hour autopilot lowers estimated net electricity cost from £${baseGbp} (baseline) to £${optGbp} (optimised), delivering £${savGbp} (${result.savingsPct}%) in simulated daily savings while ending at the same ${result.optimised.endSocKwh.toFixed(1)} kWh battery level.`;

  const actionHighlights = groupActionWindows(result.optimised.hourly);

  const financialBreakdown = `Baseline self-consumption cost: £${baseGbp} (${result.baseline.totalImportKwh} kWh imported, ${result.baseline.totalExportKwh} kWh exported). Optimised schedule cost: £${optGbp} (${result.optimised.totalImportKwh} kWh imported, ${result.optimised.totalExportKwh} kWh exported). Simulated savings: £${savGbp}.`;

  let scenarioNote =
    'Standard Day assumes typical UK solar irradiance and your configured off-peak, standard, and evening peak tariff tiers.';
  if (result.scenario === 'cloudy') {
    scenarioNote = `Cloudy Weather reduces forecast solar generation to ${result.optimised.totalSolarKwh} kWh, so the autopilot relies more on low-rate off-peak charging to protect against peak evening import prices.`;
  } else if (result.scenario === 'price_spike') {
    scenarioNote =
      'Price Spike increases 16:00–19:59 import rates, making pre-charging earlier in the day and discharging across the evening peak especially valuable.';
  }

  return {
    source: 'offline-fallback',
    reason,
    headline,
    overview,
    actionHighlights,
    financialBreakdown,
    scenarioNote,
    generatedAt: new Date().toISOString(),
  };
}
