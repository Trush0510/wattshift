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

interface TariffChartProps {
  result: OptimisationResult;
}

export function TariffChart({ result }: TariffChartProps) {
  const data = result.forecast.map((f) => ({
    label: f.label,
    importPricePence: f.importPricePence,
    exportPricePence: f.exportPricePence,
  }));

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-white">24-Hour Import & Export Tariffs (p/kWh)</h3>
        <p className="text-xs text-slate-400">
          Time-of-Use import rates vs flat Smart Export Guarantee (SEG) rate
        </p>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} minTickGap={24} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} unit="p" />
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
              dataKey="importPricePence"
              name="Import Tariff (p/kWh)"
              fill="#f43f5e"
              fillOpacity={0.75}
              radius={[4, 4, 0, 0]}
            />
            <Line
              type="monotone"
              dataKey="exportPricePence"
              name="Export Tariff (p/kWh)"
              stroke="#34d399"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
