import demoData from '../data/ukHouseholdDemo.json';
import type { HourlyForecastInput, ScenarioId, SystemConfig, TariffTier } from './types';

export const SCENARIO_META: Record<
  ScenarioId,
  { id: ScenarioId; label: string; description: string }
> = {
  standard: {
    id: 'standard',
    label: 'Standard Day',
    description: 'Typical UK spring/autumn solar curve and standard time-of-use tariff tiers.',
  },
  cloudy: {
    id: 'cloudy',
    label: 'Cloudy Weather',
    description: 'Overcast UK daylight reducing solar generation by ~65% across daylight hours.',
  },
  price_spike: {
    id: 'price_spike',
    label: 'Price Spike',
    description: 'Evening grid stress surging 16:00–19:59 import prices to 75+ p/kWh.',
  },
};

function getBaseImportPrice(tier: TariffTier, config: SystemConfig): number {
  switch (tier) {
    case 'off_peak':
      return config.offPeakImportPence;
    case 'peak':
      return config.peakImportPence;
    case 'standard':
    default:
      return config.standardImportPence;
  }
}

export function buildForecast(config: SystemConfig, scenario: ScenarioId): HourlyForecastInput[] {
  return demoData.hourlyProfile.map((slot) => {
    const tier = slot.tariffTier as TariffTier;
    let solarFactor = 1.0;

    if (scenario === 'cloudy') {
      // Overcast UK sky: heavier attenuation around midday solar peak
      solarFactor = slot.hour >= 10 && slot.hour <= 14 ? 0.30 : 0.42;
    }

    let importPricePence = getBaseImportPrice(tier, config);
    let effectiveTier: TariffTier = tier;

    if (scenario === 'price_spike' && slot.hour >= 16 && slot.hour <= 19) {
      effectiveTier = 'peak';
      importPricePence = Math.max(75.0, Number((config.peakImportPence * 2.0).toFixed(1)));
    }

    return {
      hour: slot.hour,
      label: slot.label,
      solarKw: Number((slot.solarPerKwpKw * config.solarCapacityKwp * solarFactor).toFixed(3)),
      demandKw: Number(slot.demandKw.toFixed(3)),
      importPricePence: Number(importPricePence.toFixed(2)),
      exportPricePence: Number(config.exportTariffPence.toFixed(2)),
      tariffTier: effectiveTier,
    };
  });
}
