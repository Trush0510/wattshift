export type ScenarioId = 'standard' | 'cloudy' | 'price_spike';

export type TariffTier = 'off_peak' | 'standard' | 'peak';

export type BatteryAction = 'charge' | 'discharge' | 'hold';

export interface SystemConfig {
  solarCapacityKwp: number;
  batteryCapacityKwh: number;
  initialSocPct: number;
  minReservePct: number;
  maxPowerKw: number;
  chargeEfficiency: number;
  dischargeEfficiency: number;
  offPeakImportPence: number;
  standardImportPence: number;
  peakImportPence: number;
  exportTariffPence: number;
}

export interface HourlyForecastInput {
  hour: number;
  label: string;
  solarKw: number;
  demandKw: number;
  importPricePence: number;
  exportPricePence: number;
  tariffTier: TariffTier;
}

export interface HourlySchedulePoint extends HourlyForecastInput {
  action: BatteryAction;
  chargeKw: number;
  dischargeKw: number;
  netBatteryKw: number; // positive = charging, negative = discharging
  gridImportKw: number;
  gridExportKw: number;
  socStartKwh: number;
  socEndKwh: number;
  socEndPct: number;
  costPence: number;
}

export interface ScheduleSummary {
  hourly: HourlySchedulePoint[];
  startSocKwh: number;
  endSocKwh: number;
  totalSolarKwh: number;
  totalDemandKwh: number;
  totalImportKwh: number;
  totalExportKwh: number;
  totalCostPence: number;
  totalCostGbp: number;
}

export interface OptimisationResult {
  scenario: ScenarioId;
  config: SystemConfig;
  forecast: HourlyForecastInput[];
  baseline: ScheduleSummary;
  optimised: ScheduleSummary;
  savingsPence: number;
  savingsGbp: number;
  savingsPct: number;
}

export interface ValidationErrors {
  solarCapacityKwp?: string;
  batteryCapacityKwh?: string;
  initialSocPct?: string;
  offPeakImportPence?: string;
  standardImportPence?: string;
  peakImportPence?: string;
  exportTariffPence?: string;
}

export interface ExplanationPayload {
  source: 'gemini' | 'offline-fallback';
  reason?: string;
  headline: string;
  overview: string;
  actionHighlights: string[];
  financialBreakdown: string;
  scenarioNote: string;
  generatedAt: string;
}
