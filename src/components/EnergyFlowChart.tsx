import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { OptimisationResult } from '../lib/types';

interface EnergyFlowChartProps {
  result: OptimisationResult;
  isOptimised: boolean;
}

export function EnergyFlowChart({ result, isOptimised }: EnergyFlowChartProps) {
  const data = result.optimised.hourly.map((opt, idx) => {
    const base = result.baseline.hourly[idx];
    return {
      label: opt.label,
      solarKw: opt.solarKw,
      demandKw: opt.demandKw,
      batteryKw: isOptimised ? opt.netBatteryKw : base.netBatteryKw,
    };
  });

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">24-Hour Solar, Demand & Battery Power</h3>
          <p className="text-xs text-slate-400">
            Hourly kW (+ battery = charging, − battery = discharging)
          </p>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} minTickGap={24} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} unit=" kW" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '0.75rem',
                fontSize: '12px',
                color: '#f8fafc',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar
              dataKey="batteryKw"
              name={isOptimised ? 'Optimised Battery (kW)' : 'Baseline Battery (kW)'}
              fill="#10b981"
              radius={[4, 4, 0, 0]}
            />
            <Line
              type="monotone"
              dataKey="solarKw"
              name="Solar Generation (kW)"
              stroke="#fbbf24"
              strokeWidth={2.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="demandKw"
              name="Household Demand (kW)"
              stroke="#38bdf8"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
