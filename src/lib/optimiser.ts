import { buildHourlyPoint, runBaselineSimulation, summariseSchedule } from './baseline';
import { buildForecast } from './scenarios';
import type {
  HourlyForecastInput,
  HourlySchedulePoint,
  OptimisationResult,
  ScenarioId,
  ScheduleSummary,
  SystemConfig,
} from './types';

const DP_STEPS = 200;
const WEAR_TIEBREAKER_PENCE_PER_KWH = 1e-4;

function computeStepCost(
  hour: HourlyForecastInput,
  socFrom: number,
  socTo: number,
  config: SystemConfig,
): { feasible: boolean; cost: number; chargeKw: number; dischargeKw: number } {
  const deltaSoc = socTo - socFrom;
  let chargeKw = 0;
  let dischargeKw = 0;

  if (deltaSoc > 1e-7) {
    chargeKw = deltaSoc / config.chargeEfficiency;
    if (chargeKw > config.maxPowerKw + 1e-6) {
      return { feasible: false, cost: Infinity, chargeKw: 0, dischargeKw: 0 };
    }
    chargeKw = Math.min(chargeKw, config.maxPowerKw);
  } else if (deltaSoc < -1e-7) {
    dischargeKw = -deltaSoc * config.dischargeEfficiency;
    const maxDemandCover = Math.max(0, hour.demandKw - hour.solarKw);
    if (
      dischargeKw > config.maxPowerKw + 1e-6 ||
      dischargeKw > maxDemandCover + 1e-6
    ) {
      return { feasible: false, cost: Infinity, chargeKw: 0, dischargeKw: 0 };
    }
    dischargeKw = Math.min(dischargeKw, config.maxPowerKw, maxDemandCover);
  }

  const netGridKw = hour.demandKw - hour.solarKw + chargeKw - dischargeKw;
  const gridImportKw = Math.max(0, netGridKw);
  const gridExportKw = Math.max(0, -netGridKw);

  const energyCost =
    gridImportKw * hour.importPricePence - gridExportKw * hour.exportPricePence;
  const wearPenalty = (chargeKw + dischargeKw) * WEAR_TIEBREAKER_PENCE_PER_KWH;

  return {
    feasible: true,
    cost: energyCost + wearPenalty,
    chargeKw,
    dischargeKw,
  };
}

function solveDynamicProgram(
  forecast: HourlyForecastInput[],
  config: SystemConfig,
  startSocKwh: number,
  targetEndSocKwh: number,
): ScheduleSummary {
  const minReserveKwh = (config.minReservePct / 100) * config.batteryCapacityKwh;
  const maxCapKwh = config.batteryCapacityKwh;
  const span = maxCapKwh - minReserveKwh;
  const grid = Array.from({ length: DP_STEPS + 1 }, (_, i) =>
    minReserveKwh + (span * i) / DP_STEPS,
  );

  const hours = forecast.length; // 24
  // dp[t][i] = min cost from hour t (state grid[i]) to hour 24 (targetEndSocKwh)
  const dp: Float64Array[] = Array.from({ length: hours }, () =>
    new Float64Array(DP_STEPS + 1).fill(Infinity),
  );
  const nextIdx: Int16Array[] = Array.from({ length: hours }, () =>
    new Int16Array(DP_STEPS + 1).fill(-1),
  );

  // Base case: last hour (t = 23) transitions directly to targetEndSocKwh
  const lastHour = forecast[hours - 1];
  for (let i = 0; i <= DP_STEPS; i++) {
    const step = computeStepCost(lastHour, grid[i], targetEndSocKwh, config);
    if (step.feasible) {
      dp[hours - 1][i] = step.cost;
    }
  }

  // Backward induction for t = 22 down to 1
  for (let t = hours - 2; t >= 1; t--) {
    const hour = forecast[t];
    for (let i = 0; i <= DP_STEPS; i++) {
      let bestCost = Infinity;
      let bestJ = -1;
      for (let j = 0; j <= DP_STEPS; j++) {
        if (!Number.isFinite(dp[t + 1][j])) continue;
        const step = computeStepCost(hour, grid[i], grid[j], config);
        if (!step.feasible) continue;
        const total = step.cost + dp[t + 1][j];
        if (total < bestCost) {
          bestCost = total;
          bestJ = j;
        }
      }
      dp[t][i] = bestCost;
      nextIdx[t][i] = bestJ;
    }
  }

  // Hour 0 transitions from exact startSocKwh to grid[j] at t = 1
  let bestStartCost = Infinity;
  let bestFirstJ = -1;
  for (let j = 0; j <= DP_STEPS; j++) {
    if (!Number.isFinite(dp[1][j])) continue;
    const step = computeStepCost(forecast[0], startSocKwh, grid[j], config);
    if (!step.feasible) continue;
    const total = step.cost + dp[1][j];
    if (total < bestStartCost) {
      bestStartCost = total;
      bestFirstJ = j;
    }
  }

  if (bestFirstJ === -1) {
    throw new Error('Optimiser could not find a feasible battery schedule.');
  }

  // Reconstruct hourly schedule
  const hourly: HourlySchedulePoint[] = [];
  let currentSoc = startSocKwh;
  let stateIndex = bestFirstJ;

  for (let t = 0; t < hours; t++) {
    const nextSoc = t === hours - 1 ? targetEndSocKwh : grid[stateIndex];
    const step = computeStepCost(forecast[t], currentSoc, nextSoc, config);
    const point = buildHourlyPoint(
      forecast[t],
      currentSoc,
      step.chargeKw,
      step.dischargeKw,
      config,
    );
    hourly.push(point);
    currentSoc = point.socEndKwh;
    if (t < hours - 2) {
      stateIndex = nextIdx[t + 1][stateIndex];
    }
  }

  return summariseSchedule(hourly, startSocKwh);
}

export function runEnergyOptimisation(
  config: SystemConfig,
  scenario: ScenarioId = 'standard',
): OptimisationResult {
  const forecast = buildForecast(config, scenario);
  const baseline = runBaselineSimulation(forecast, config);

  let optimised = solveDynamicProgram(
    forecast,
    config,
    baseline.startSocKwh,
    baseline.endSocKwh,
  );

  // Guard against discretization tie where baseline is already optimal
  if (optimised.totalCostPence > baseline.totalCostPence) {
    optimised = baseline;
  }

  const baselineCostGbp = baseline.totalCostGbp;
  const optimisedCostGbp = optimised.totalCostGbp;
  const savingsGbp = Number((baselineCostGbp - optimisedCostGbp).toFixed(2));
  const savingsPence = Number((baseline.totalCostPence - optimised.totalCostPence).toFixed(2));
  const savingsPct =
    baseline.totalCostPence > 0
      ? Number(((savingsPence / baseline.totalCostPence) * 100).toFixed(1))
      : 0;

  return {
    scenario,
    config,
    forecast,
    baseline,
    optimised,
    savingsPence,
    savingsGbp,
    savingsPct,
  };
}
