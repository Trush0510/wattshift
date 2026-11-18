import { BatteryCharging, PoundSterling, SlidersHorizontal, Sun } from 'lucide-react';
import type { SystemConfig, ValidationErrors } from '../lib/types';
import { FieldInput } from './FieldInput';

interface ConfigPanelProps {
  config: SystemConfig;
  errors: ValidationErrors;
  onFieldChange: <K extends keyof SystemConfig>(field: K, value: number) => void;
}

interface FieldSpec {
  field: keyof SystemConfig;
  id: string;
  label: string;
  unit: string;
  step: number;
  min: number;
  max: number;
}

const SYSTEM_FIELDS: FieldSpec[] = [
  { field: 'solarCapacityKwp', id: 'solar-capacity', label: 'Solar Capacity', unit: 'kWp', step: 0.5, min: 0.5, max: 25 },
  { field: 'batteryCapacityKwh', id: 'battery-capacity', label: 'Battery Capacity', unit: 'kWh', step: 0.5, min: 2, max: 40 },
  { field: 'initialSocPct', id: 'initial-soc', label: 'Initial Battery Charge', unit: '%', step: 5, min: 0, max: 100 },
];

const TARIFF_FIELDS: FieldSpec[] = [
  { field: 'offPeakImportPence', id: 'offpeak-tariff', label: 'Off-Peak Import (00:00–04:59)', unit: 'p/kWh', step: 0.5, min: 0, max: 200 },
  { field: 'standardImportPence', id: 'standard-tariff', label: 'Standard Import', unit: 'p/kWh', step: 0.5, min: 0, max: 200 },
  { field: 'peakImportPence', id: 'peak-tariff', label: 'Evening Peak Import (16:00–18:59)', unit: 'p/kWh', step: 0.5, min: 0, max: 200 },
  { field: 'exportTariffPence', id: 'export-tariff', label: 'SEG Export Rate', unit: 'p/kWh', step: 0.5, min: 0, max: 200 },
];

export function ConfigPanel({ config, errors, onFieldChange }: ConfigPanelProps) {
  const initialKwh = ((config.initialSocPct || 0) / 100) * (config.batteryCapacityKwh || 0);

  const renderField = (spec: FieldSpec) => (
    <FieldInput
      key={spec.id}
      id={spec.id}
      label={spec.label}
      unit={spec.unit}
      value={config[spec.field]}
      step={spec.step}
      min={spec.min}
      max={spec.max}
      hint={
        spec.field === 'initialSocPct'
          ? `Starts at ${initialKwh.toFixed(1)} kWh (min reserve ${config.minReservePct}%)`
          : undefined
      }
      error={errors[spec.field as keyof ValidationErrors]}
      onChange={(v) => onFieldChange(spec.field, v)}
    />
  );

  return (
    <aside className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2 border-b border-slate-800 pb-3">
        <SlidersHorizontal className="h-4 w-4 text-emerald-400" />
        <h2 className="text-sm font-semibold text-white">System & Tariff Settings</h2>
      </div>

      <div className="space-y-5">
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <Sun className="h-3.5 w-3.5" />
            <span>Solar & Battery</span>
          </div>
          {SYSTEM_FIELDS.map(renderField)}
        </div>

        <div className="space-y-3 border-t border-slate-800 pt-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-sky-400">
            <PoundSterling className="h-3.5 w-3.5" />
            <span>UK Tariffs (p/kWh)</span>
          </div>
          {TARIFF_FIELDS.map(renderField)}
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs text-slate-400">
          <div className="mb-1 flex items-center gap-1.5 font-medium text-slate-300">
            <BatteryCharging className="h-3.5 w-3.5 text-emerald-400" />
            <span>Inverter Constraints</span>
          </div>
          <p>
            Max charge/discharge: <strong>{config.maxPowerKw} kW</strong> · Min reserve:{' '}
            <strong>{config.minReservePct}%</strong> · Round-trip efficiency:{' '}
            <strong>{(config.chargeEfficiency * config.dischargeEfficiency * 100).toFixed(0)}%</strong>
          </p>
        </div>
      </div>
    </aside>
  );
}
