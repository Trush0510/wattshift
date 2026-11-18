import { describe, expect, it } from 'vitest';
import { runEnergyOptimisation } from '../../src/lib/optimiser';
import { DEFAULT_CONFIG } from '../../src/lib/validation';

describe('Energy Optimisation Engine (AC2 & AC3)', () => {
  it('produces 24 hourly actions, respects physical constraints, and matches start/end SoC', () => {
    const result = runEnergyOptimisation(DEFAULT_CONFIG, 'standard');

    expect(result.optimised.hourly).toHaveLength(24);
    expect(result.baseline.hourly).toHaveLength(24);

    // Boundary SoC parity (AC2)
    expect(result.optimised.startSocKwh).toBeCloseTo(result.baseline.startSocKwh, 5);
    expect(result.optimised.endSocKwh).toBeCloseTo(result.baseline.endSocKwh, 5);

    const minReserveKwh =
      (DEFAULT_CONFIG.minReservePct / 100) * DEFAULT_CONFIG.batteryCapacityKwh;

    for (const hour of result.optimised.hourly) {
      expect(['charge', 'discharge', 'hold']).toContain(hour.action);
      expect(hour.socStartKwh).toBeGreaterThanOrEqual(minReserveKwh - 1e-4);
      expect(hour.socStartKwh).toBeLessThanOrEqual(DEFAULT_CONFIG.batteryCapacityKwh + 1e-4);
      expect(hour.socEndKwh).toBeGreaterThanOrEqual(minReserveKwh - 1e-4);
      expect(hour.socEndKwh).toBeLessThanOrEqual(DEFAULT_CONFIG.batteryCapacityKwh + 1e-4);
      expect(hour.chargeKw).toBeGreaterThanOrEqual(0);
      expect(hour.chargeKw).toBeLessThanOrEqual(DEFAULT_CONFIG.maxPowerKw + 1e-4);
      expect(hour.dischargeKw).toBeGreaterThanOrEqual(0);
      expect(hour.dischargeKw).toBeLessThanOrEqual(DEFAULT_CONFIG.maxPowerKw + 1e-4);
      // Mutual exclusivity
      expect(hour.chargeKw * hour.dischargeKw).toBe(0);
    }

    // Savings = baseline - optimised >= 0
    expect(result.savingsPence).toBeGreaterThanOrEqual(0);
    expect(result.savingsGbp).toBe(
      Number((result.baseline.totalCostGbp - result.optimised.totalCostGbp).toFixed(2)),
    );
  });

  it('reduces forecast solar generation in Cloudy Weather scenario (AC3)', () => {
    const standard = runEnergyOptimisation(DEFAULT_CONFIG, 'standard');
    const cloudy = runEnergyOptimisation(DEFAULT_CONFIG, 'cloudy');

    expect(cloudy.optimised.totalSolarKwh).toBeLessThan(standard.optimised.totalSolarKwh * 0.5);
    expect(cloudy.savingsPence).toBeGreaterThanOrEqual(0);
    expect(cloudy.optimised.endSocKwh).toBeCloseTo(cloudy.baseline.endSocKwh, 5);
  });

  it('increases evening import prices in Price Spike scenario and yields non-negative savings (AC3)', () => {
    const standard = runEnergyOptimisation(DEFAULT_CONFIG, 'standard');
    const spike = runEnergyOptimisation(DEFAULT_CONFIG, 'price_spike');

    expect(spike.forecast[17].importPricePence).toBeGreaterThan(
      standard.forecast[17].importPricePence,
    );
    expect(spike.savingsPence).toBeGreaterThan(0);
    expect(spike.optimised.endSocKwh).toBeCloseTo(spike.baseline.endSocKwh, 5);
  });

  it('handles flat tariffs cleanly without negative savings', () => {
    const flatConfig = {
      ...DEFAULT_CONFIG,
      offPeakImportPence: 25,
      standardImportPence: 25,
      peakImportPence: 25,
      exportTariffPence: 10,
    };
    const result = runEnergyOptimisation(flatConfig, 'standard');
    expect(result.savingsPence).toBeGreaterThanOrEqual(0);
  });
});
