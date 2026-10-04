import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Copy, Check, AlertTriangle, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Run } from '../../api/types';
import { StatusBadge } from './StatusBadge';

interface RunTableProps {
  runs: Run[];
  loading: boolean;
  reveal: boolean;
}

export const RunTable: React.FC<RunTableProps> = ({ runs, loading, reveal }) => {
  const navigate = useNavigate();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyId = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1200);
  };

  if (loading) {
    return (
      <div className="border border-border-subtle rounded-lg bg-bg-base overflow-hidden">
        <div className="divide-y divide-border-subtle">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-3.5 flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-16 h-4 bg-zinc-800 rounded" />
                <div className="w-24 h-4 bg-zinc-800/80 rounded" />
                <div className="w-32 h-4 bg-zinc-800/60 rounded" />
                <div className="w-48 h-4 bg-zinc-800/40 rounded hidden md:block" />
              </div>
              <div className="w-8 h-4 bg-zinc-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <div className="border border-border-subtle rounded-lg bg-bg-base p-10 text-center space-y-2">
        <AlertTriangle className="w-6 h-6 text-zinc-500 mx-auto" />
        <h3 className="text-xs font-mono font-semibold text-zinc-200 uppercase tracking-wide">
          No matching execution traces
        </h3>
        <p className="text-[11px] text-zinc-500 font-mono">
          Try resetting search criteria or selecting a different template.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-border-subtle rounded-lg bg-bg-base overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-border-subtle bg-bg-surface text-zinc-400 text-[10px] uppercase tracking-wider select-none">
              <th className="py-2.5 px-3.5 font-semibold w-28">Status</th>
              <th className="py-2.5 px-3.5 font-semibold w-36">Run ID</th>
              <th className="py-2.5 px-3.5 font-semibold w-32">Template</th>
              <th className="py-2.5 px-3.5 font-semibold text-center w-20">Steps</th>
              <th className="py-2.5 px-3.5 font-semibold w-28">Suspect</th>
              <th className="py-2.5 px-3.5 font-semibold w-24">Agent</th>
              <th className="py-2.5 px-3.5 font-semibold">Outcome / Failure Note</th>
              {reveal && <th className="py-2.5 px-3.5 font-semibold w-36">Ground Truth</th>}
              <th className="py-2.5 px-3 w-6"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {runs.map((run, idx) => {
              const suspectText =
                run.suspect_step !== null && run.suspect_step !== undefined
                  ? `step_${run.suspect_step.toString().padStart(2, '0')}`
                  : '—';

              return (
                <motion.tr
                  key={run.id}
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.14, delay: idx * 0.02 }}
                  onClick={() => navigate(`/runs/${run.id}`)}
                  className="hover:bg-bg-elevated/70 cursor-pointer transition-colors duration-100 group"
                >
                  {/* Status */}
                  <td className="py-2.5 px-3.5">
                    <StatusBadge status={run.status} />
                  </td>

                  {/* Run ID with quick copy */}
                  <td className="py-2.5 px-3.5 font-bold text-zinc-200 group-hover:text-blue-400 transition-colors">
                    <div className="flex items-center gap-1.5">
                      <span>{run.id}</span>
                      <button
                        onClick={(e) => handleCopyId(e, run.id)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-zinc-500 hover:text-zinc-300 transition-opacity"
                        title="Copy Run ID"
                      >
                        {copiedId === run.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Template */}
                  <td className="py-2.5 px-3.5">
                    <span className="px-1.5 py-0.5 rounded bg-bg-surface border border-border-subtle text-[11px] text-zinc-300">
                      {run.template}
                    </span>
                  </td>

                  {/* Step Count */}
                  <td className="py-2.5 px-3.5 text-center text-zinc-400">
                    <span className="flex items-center justify-center gap-1">
                      <Layers className="w-3 h-3 text-zinc-500" />
                      {run.steps?.length || 0}
                    </span>
                  </td>

                  {/* Suspect Step */}
                  <td className="py-2.5 px-3.5">
                    {run.suspect_step ? (
                      <span className="text-amber-400 font-semibold">{suspectText}</span>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>

                  {/* Agent Kind */}
                  <td className="py-2.5 px-3.5 text-[11px] text-zinc-400">
                    {run.agent_kind}
                  </td>

                  {/* Outcome Summary */}
                  <td
                    className="py-2.5 px-3.5 text-zinc-300 font-sans truncate max-w-sm"
                    title={run.outcome_summary}
                  >
                    {run.outcome_summary}
                  </td>

                  {/* Ground truth fault (if revealed) */}
                  {reveal && (
                    <td className="py-2.5 px-3.5 font-mono text-[11px] text-rose-400 font-semibold">
                      {run.fault?.fault_type || '—'}
                    </td>
                  )}

                  {/* Row chevron */}
                  <td className="py-2.5 px-3 text-right">
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-300 transition-colors inline" />
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
