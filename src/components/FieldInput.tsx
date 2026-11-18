import { AlertCircle } from 'lucide-react';

export interface FieldInputProps {
  id: string;
  label: string;
  unit: string;
  value: number;
  step: number;
  min: number;
  max: number;
  error?: string;
  hint?: string;
  onChange: (value: number) => void;
}

/** Numeric form field with unit badge, optional hint, and accessible error state. */
export function FieldInput({
  id,
  label,
  unit,
  value,
  step,
  min,
  max,
  error,
  hint,
  onChange,
}: FieldInputProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-xs font-medium text-slate-300">
          {label}
        </label>
        <span className="text-xs text-slate-400">{unit}</span>
      </div>
      <input
        id={id}
        type="number"
        step={step}
        min={min}
        max={max}
        value={Number.isNaN(value) ? '' : value}
        onChange={(e) => {
          const parsed = e.target.value === '' ? Number.NaN : Number(e.target.value);
          onChange(parsed);
        }}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full rounded-lg border bg-slate-950 px-3 py-2 text-sm text-white outline-none transition ${
          error
            ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/40'
            : 'border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30'
        }`}
      />
      {hint && !error && <p className="text-[11px] text-slate-400">{hint}</p>}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="flex items-center gap-1 text-xs font-medium text-rose-400"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
