import type {
  BatteryAction,
  HourlyForecastInput,
  HourlySchedulePoint,
  ScheduleSummary,
  SystemConfig,
} from './types';

export function buildHourlyPoint(
  input: HourlyForecastInput,
  socStartKwh: number,
  chargeKw: number,
  dischargeKw: number,
  config: SystemConfig,
): HourlySchedulePoint {
  const safeCharge = chargeKw > 1e-6 ? chargeKw : 0;
  const safeDischarge = dischargeKw > 1e-6 ? dischargeKw : 0;

  let action: BatteryAction = 'hold';
  if (safeCharge > 0) {
    action = 'charge';
  } else if (safeDischarge > 0) {
    action = 'discharge';
  }

  const rawSocEnd =
    socStartKwh +
    safeCharge * config.chargeEfficiency -
    safeDischarge / config.dischargeEfficiency;

  const minReserveKwh = (config.minReservePct / 100) * config.batteryCapacityKwh;
  const socEndKwh = Math.min(config.batteryCapacityKwh, Math.max(minReserveKwh, rawSocEnd));

  const netGridKw = input.demandKw - input.solarKw + safeCharge - safeDischarge;
  const gridImportKw = Math.max(0, netGridKw);
  const gridExportKw = Math.max(0, -netGridKw);

  const costPence =
    gridImportKw * input.importPricePence - gridExportKw * input.exportPricePence;

  return {
    ...input,
    action,
    chargeKw: Number(safeCharge.toFixed(4)),
    dischargeKw: Number(safeDischarge.toFixed(4)),
    netBatteryKw: Number((safeCharge - safeDischarge).toFixed(4)),
    gridImportKw: Number(gridImportKw.toFixed(4)),
    gridExportKw: Number(gridExportKw.toFixed(4)),
    socStartKwh: Number(socStartKwh.toFixed(4)),
    socEndKwh: Number(socEndKwh.toFixed(4)),
    socEndPct: Number(((socEndKwh / config.batteryCapacityKwh) * 100).toFixed(1)),
    costPence: Number(costPence.toFixed(4)),
  };
}

export function summariseSchedule(
  hourly: HourlySchedulePoint[],
  startSocKwh: number,
): ScheduleSummary {
  const totalSolarKwh = hourly.reduce((acc, h) => acc + h.solarKw, 0);
  const totalDemandKwh = hourly.reduce((acc, h) => acc + h.demandKw, 0);
  const totalImportKwh = hourly.reduce((acc, h) => acc + h.gridImportKw, 0);
  const totalExportKwh = hourly.reduce((acc, h) => acc + h.gridExportKw, 0);
  const totalCostPence = hourly.reduce((acc, h) => acc + h.costPence, 0);
  const endSocKwh = hourly.length > 0 ? hourly[hourly.length - 1].socEndKwh : startSocKwh;

  return {
    hourly,
    startSocKwh: Number(startSocKwh.toFixed(4)),
    endSocKwh: Number(endSocKwh.toFixed(4)),
    totalSolarKwh: Number(totalSolarKwh.toFixed(2)),
    totalDemandKwh: Number(totalDemandKwh.toFixed(2)),
    totalImportKwh: Number(totalImportKwh.toFixed(2)),
    totalExportKwh: Number(totalExportKwh.toFixed(2)),
    totalCostPence: Number(totalCostPence.toFixed(2)),
    totalCostGbp: Number((totalCostPence / 100).toFixed(2)),
  };
}

/**
 * Simulates standard unmanaged UK hybrid-inverter self-consumption:
 * - Absorbs excess solar up to maxPowerKw and batteryCapacityKwh.
 * - Discharges to cover household deficit down to minReserveKwh.
 * - Never grid-charges during off-peak tariffs.
 */
export function runBaselineSimulation(
  forecast: HourlyForecastInput[],
  config: SystemConfig,
): ScheduleSummary {
  const startSocKwh = (config.initialSocPct / 100) * config.batteryCapacityKwh;
  const minReserveKwh = (config.minReservePct / 100) * config.batteryCapacityKwh;
  let currentSoc = startSocKwh;
  const hourly: HourlySchedulePoint[] = [];

  for (const hour of forecast) {
    let chargeKw = 0;
    let dischargeKw = 0;

    if (hour.solarKw > hour.demandKw) {
      const excessSolar = hour.solarKw - hour.demandKw;
      const headroomKwh = Math.max(0, config.batteryCapacityKwh - currentSoc);
      const maxGridChargeForHeadroom = headroomKwh / config.chargeEfficiency;
      chargeKw = Math.min(excessSolar, config.maxPowerKw, maxGridChargeForHeadroom);
    } else if (hour.demandKw > hour.solarKw) {
      const deficit = hour.demandKw - hour.solarKw;
      const availableEnergyKwh = Math.max(0, currentSoc - minReserveKwh);
      const maxUsefulDischarge = availableEnergyKwh * config.dischargeEfficiency;
      dischargeKw = Math.min(deficit, config.maxPowerKw, maxUsefulDischarge);
    }

    const point = buildHourlyPoint(hour, currentSoc, chargeKw, dischargeKw, config);
    hourly.push(point);
    currentSoc = point.socEndKwh;
  }

  return summariseSchedule(hourly, startSocKwh);
}
