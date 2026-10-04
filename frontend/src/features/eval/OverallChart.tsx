import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { BaselineMetric } from '../../api/types';

interface OverallChartProps {
  metrics: BaselineMetric[];
}

export const OverallChart: React.FC<OverallChartProps> = ({ metrics }) => {
  const chartData = metrics.map((m) => ({
    name: m.name,
    'Top-1 Accuracy': Math.round(m.top_1 * 100),
    'Top-3 Accuracy': Math.round(m.top_3 * 100),
    mean_rank: m.mean_rank,
  }));

  return (
    <div className="p-4 rounded-lg bg-bg-base border border-border-subtle space-y-2.5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">
            Model vs Baseline Accuracy
          </h3>
          <p className="text-[11px] text-zinc-400 mt-0.5 font-sans">
            Top-1 and Top-3 blame attribution accuracy (%)
          </p>
        </div>
      </div>

      <div className="h-60 w-full text-xs font-mono">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: -22, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#71717a"
              fontSize={10}
              tickLine={false}
              interval={0}
              angle={-12}
              textAnchor="end"
            />
            <YAxis stroke="#71717a" fontSize={10} tickLine={false} domain={[0, 100]} unit="%" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#151617',
                borderColor: 'rgba(255,255,255,0.1)',
                borderRadius: '6px',
                fontSize: '11px',
                fontFamily: 'monospace',
                color: '#f4f4f5',
              }}
              formatter={(value: any) => [`${value}%`]}
            />
            <Legend
              wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', paddingTop: '6px' }}
            />
            <Bar dataKey="Top-1 Accuracy" fill="#3B82F6" radius={[2, 2, 0, 0]} />
            <Bar dataKey="Top-3 Accuracy" fill="#10B981" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
