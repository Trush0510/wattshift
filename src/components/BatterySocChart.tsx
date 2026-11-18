import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { OptimisationResult } from '../lib/types';

interface BatterySocChartProps {
  result: OptimisationResult;
  isOptimised: boolean;
}

export function BatterySocChart({ result, isOptimised }: BatterySocChartProps) {
  const minReserveKwh = Number(
    ((result.config.minReservePct / 100) * result.config.batteryCapacityKwh).toFixed(2),
  );

  const data = result.baseline.hourly.map((base, idx) => ({
    label: base.label,
    baselineSocKwh: base.socEndKwh,
    optimisedSocKwh: result.optimised.hourly[idx].socEndKwh,
  }));

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-white">Battery State of Charge (kWh)</h3>
        <p className="text-xs text-slate-400">
          Bounded between {minReserveKwh} kWh reserve and {result.config.batteryCapacityKwh} kWh capacity
        </p>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} minTickGap={24} />
            <YAxis
              domain={[0, Math.ceil(result.config.batteryCapacityKwh * 1.05)]}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              unit=" kWh"
            />
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
            <ReferenceLine
              y={result.config.batteryCapacityKwh}
              stroke="#64748b"
              strokeDasharray="4 4"
              label={{ value: 'Max', fill: '#94a3b8', fontSize: 10, position: 'insideTopRight' }}
            />
            <ReferenceLine
              y={minReserveKwh}
              stroke="#f43f5e"
              strokeDasharray="4 4"
              label={{ value: 'Reserve', fill: '#fb7185', fontSize: 10, position: 'insideBottomRight' }}
            />
            <Line
              type="monotone"
              dataKey="baselineSocKwh"
              name="Baseline SoC (kWh)"
              stroke="#94a3b8"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
            />
            {isOptimised && (
              <Line
                type="monotone"
                dataKey="optimisedSocKwh"
                name="Optimised SoC (kWh)"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
