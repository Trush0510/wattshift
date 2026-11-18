import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, isValidConfig, validateConfig } from '../../src/lib/validation';

describe('System Configuration Validation (AC1 & AC5)', () => {
  it('accepts the preloaded UK household demonstration defaults', () => {
    expect(isValidConfig(DEFAULT_CONFIG)).toBe(true);
    expect(validateConfig(DEFAULT_CONFIG)).toEqual({});
  });

  it('rejects initial SoC below minimum reserve', () => {
    const errors = validateConfig({ ...DEFAULT_CONFIG, initialSocPct: 5 });
    expect(errors.initialSocPct).toMatch(/10%/);
  });

  it('rejects out-of-range solar or battery capacities', () => {
    const zeroBattery = validateConfig({
      ...DEFAULT_CONFIG,
      batteryCapacityKwh: 0,
    });
    expect(zeroBattery.batteryCapacityKwh).toBe('Battery capacity must be greater than 0');

    const errors = validateConfig({
      ...DEFAULT_CONFIG,
      solarCapacityKwp: 0.1,
      batteryCapacityKwh: 50,
    });
    expect(errors.solarCapacityKwp).toBeDefined();
    expect(errors.batteryCapacityKwh).toBeDefined();
  });

  it('rejects inconsistent tariff ordering', () => {
    const errors = validateConfig({
      ...DEFAULT_CONFIG,
      offPeakImportPence: 30,
      standardImportPence: 20,
    });
    expect(errors.offPeakImportPence).toBeDefined();
  });
});
