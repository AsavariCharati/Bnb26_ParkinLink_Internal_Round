import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { FeatureImportanceItem } from '../../api/types';

interface FeatureImportanceProps {
  features: FeatureImportanceItem[];
}

export const FeatureImportance: React.FC<FeatureImportanceProps> = ({ features }) => {
  const chartData = [...features]
    .sort((a, b) => a.importance - b.importance)
    .map((f) => ({
      feature: f.feature,
      importance: Math.round(f.importance * 1000) / 10,
      description: f.description,
    }));

  return (
    <div className="p-4 rounded-lg bg-bg-base border border-border-subtle space-y-3">
      <div>
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">
          Model Feature Importance Ranking
        </h3>
        <p className="text-[11px] text-zinc-400 mt-0.5 font-sans">
          Gini importance distribution across trace structural and semantic signals
        </p>
      </div>

      <div className="h-60 w-full text-xs font-mono">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 25, left: 60, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
            <XAxis type="number" stroke="#71717a" fontSize={10} tickLine={false} unit="%" />
            <YAxis
              type="category"
              dataKey="feature"
              stroke="#71717a"
              fontSize={10}
              tickLine={false}
              width={140}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#151617',
                borderColor: 'rgba(255,255,255,0.1)',
                borderRadius: '6px',
                fontSize: '11px',
                fontFamily: 'monospace',
                color: '#f4f4f5',
              }}
              formatter={(value: any, _: any, item: any) => [
                `${value}% (${item.payload.description})`,
                'Importance',
              ]}
            />
            <Bar dataKey="importance" fill="#8B5CF6" radius={[0, 2, 2, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
