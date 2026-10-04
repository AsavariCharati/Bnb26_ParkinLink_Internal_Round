import React from 'react';
import { FaultTypeMetric } from '../../api/types';

interface FaultTableProps {
  faultMetrics: FaultTypeMetric[];
}

export const FaultTable: React.FC<FaultTableProps> = ({ faultMetrics }) => {
  return (
    <div className="p-4 rounded-lg bg-bg-base border border-border-subtle space-y-2.5">
      <div>
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">
          Per-Fault-Type Diagnostic Breakdown
        </h3>
        <p className="text-[11px] text-zinc-400 mt-0.5 font-sans">
          Stratified attribution performance across injected fault categories
        </p>
      </div>

      <div className="border border-border-subtle rounded-md overflow-hidden bg-bg-deep text-xs font-mono">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border-subtle bg-bg-surface text-zinc-400 text-[10px] uppercase tracking-wider">
              <th className="py-2 px-3 font-semibold">Fault Type</th>
              <th className="py-2 px-3 font-semibold text-center">N Samples</th>
              <th className="py-2 px-3 font-semibold text-center">Top-1 Accuracy</th>
              <th className="py-2 px-3 font-semibold text-center">Top-3 Accuracy</th>
              <th className="py-2 px-3 font-semibold text-center">Mean Rank</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {faultMetrics.map((row) => (
              <tr key={row.fault_type} className="hover:bg-bg-elevated/40 transition-colors">
                <td className="py-2 px-3 font-medium text-zinc-200">{row.fault_type}</td>
                <td className="py-2 px-3 text-center text-zinc-400">{row.n_samples}</td>
                <td className="py-2 px-3 text-center text-blue-400 font-bold">
                  {(row.top_1 * 100).toFixed(1)}%
                </td>
                <td className="py-2 px-3 text-center text-emerald-400 font-bold">
                  {(row.top_3 * 100).toFixed(1)}%
                </td>
                <td className="py-2 px-3 text-center text-zinc-200 font-semibold">
                  {row.mean_rank.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
