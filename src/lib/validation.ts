import demoData from '../data/ukHouseholdDemo.json';
import type { SystemConfig, ValidationErrors } from './types';

export const DEFAULT_CONFIG: SystemConfig = { ...demoData.defaultConfig };

export function validateConfig(config: SystemConfig): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!Number.isFinite(config.solarCapacityKwp) || config.solarCapacityKwp < 0.5 || config.solarCapacityKwp > 25) {
    errors.solarCapacityKwp = 'Solar capacity must be between 0.5 and 25.0 kWp.';
  }

  if (!Number.isFinite(config.batteryCapacityKwh) || config.batteryCapacityKwh <= 0) {
    errors.batteryCapacityKwh = 'Battery capacity must be greater than 0';
  } else if (config.batteryCapacityKwh < 2 || config.batteryCapacityKwh > 40) {
    errors.batteryCapacityKwh = 'Battery capacity must be between 2.0 and 40.0 kWh.';
  }

  if (
    !Number.isFinite(config.initialSocPct) ||
    config.initialSocPct < config.minReservePct ||
    config.initialSocPct > 100
  ) {
    errors.initialSocPct = `Initial charge must be between ${config.minReservePct}% (reserve) and 100%.`;
  }

  const checkRate = (val: number, label: string): string | undefined => {
    if (!Number.isFinite(val) || val < 0 || val > 200) {
      return `${label} must be between 0 and 200 p/kWh.`;
    }
    return undefined;
  };

  errors.offPeakImportPence = checkRate(config.offPeakImportPence, 'Off-peak import');
  errors.standardImportPence = checkRate(config.standardImportPence, 'Standard import');
  errors.peakImportPence = checkRate(config.peakImportPence, 'Peak import');
  errors.exportTariffPence = checkRate(config.exportTariffPence, 'Export tariff');

  if (!errors.offPeakImportPence && !errors.standardImportPence && config.offPeakImportPence > config.standardImportPence) {
    errors.offPeakImportPence = 'Off-peak rate cannot exceed standard import rate.';
  }

  if (!errors.standardImportPence && !errors.peakImportPence && config.standardImportPence > config.peakImportPence) {
    errors.peakImportPence = 'Peak rate cannot be lower than standard import rate.';
  }

  if (!errors.exportTariffPence && !errors.peakImportPence && config.exportTariffPence > config.peakImportPence) {
    errors.exportTariffPence = 'Export rate cannot exceed peak import rate.';
  }

  // Strip undefined entries so Object.keys(errors).length === 0 means valid
  for (const key of Object.keys(errors) as (keyof ValidationErrors)[]) {
    if (errors[key] === undefined) {
      delete errors[key];
    }
  }

  return errors;
}

export function isValidConfig(config: SystemConfig): boolean {
  return Object.keys(validateConfig(config)).length === 0;
}
