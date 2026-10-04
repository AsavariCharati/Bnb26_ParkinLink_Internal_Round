import React from 'react';
import { EvidenceItem } from '../../api/types';

interface EvidenceTableProps {
  evidence: EvidenceItem[];
}

export const EvidenceTable: React.FC<EvidenceTableProps> = ({ evidence }) => {
  if (!evidence || evidence.length === 0) {
    return (
      <div className="text-[11px] text-zinc-500 font-mono p-2 bg-bg-deep rounded border border-border-subtle">
        No specific observable anomaly evidence recorded.
      </div>
    );
  }

  return (
    <div className="border border-border-subtle rounded-md overflow-hidden bg-bg-deep text-xs font-mono">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border-subtle bg-bg-surface text-zinc-400 text-[10px] uppercase tracking-wider">
            <th className="py-2 px-3 font-semibold">Evidence Metric</th>
            <th className="py-2 px-3 font-semibold">Observed Anomaly</th>
            <th className="py-2 px-3 font-semibold">Typical / Expected</th>
            <th className="py-2 px-3 font-semibold w-20">Category</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {evidence.map((item, idx) => (
            <tr key={idx} className="hover:bg-bg-elevated/40 transition-colors">
              <td className="py-2 px-3 font-medium text-zinc-200 text-[11px]">{item.name}</td>
              <td className="py-2 px-3 text-rose-300 font-mono break-all text-[11px]">
                {item.observed}
              </td>
              <td className="py-2 px-3 text-emerald-400 font-mono break-all text-[11px]">
                {item.typical_or_expected}
              </td>
              <td className="py-2 px-3 text-[9px] text-zinc-500 uppercase font-semibold">
                <span className="px-1.5 py-0.2 rounded bg-bg-surface border border-border-subtle">
                  {item.category}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
