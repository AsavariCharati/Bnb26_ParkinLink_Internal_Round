import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { EvalResults } from '../../api/types';

interface UnseenSplitChartProps {
  seenVsUnseen: EvalResults['seen_vs_unseen'];
  leaveOneOut: EvalResults['leave_one_template_out'];
}

export const UnseenSplitChart: React.FC<UnseenSplitChartProps> = ({
  seenVsUnseen,
  leaveOneOut,
}) => {
  const seen = seenVsUnseen.seen_fault_types;
  const unseen = seenVsUnseen.unseen_fault_types;

  return (
    <div className="p-4 rounded-lg bg-bg-base border border-border-subtle space-y-3.5">
      <div>
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">
          Generalization & Held-Out Splits
        </h3>
        <p className="text-[11px] text-zinc-400 mt-0.5 font-sans">
          Evaluating attribution performance on seen vs held-out unseen fault classes and templates
        </p>
      </div>

      {/* Seen vs Unseen Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Seen */}
        <div className="p-3 rounded-md bg-bg-surface border border-border-subtle space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-zinc-200">
              Seen Fault Types
            </span>
            <span className="text-[10px] font-mono text-zinc-400">N = {seen.n_samples}</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-center font-mono">
            <div className="p-1.5 rounded bg-bg-deep border border-border-subtle">
              <div className="text-[9px] text-zinc-400 uppercase">Top-1</div>
              <div className="text-xs font-bold text-blue-400">
                {(seen.top_1 * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-1.5 rounded bg-bg-deep border border-border-subtle">
              <div className="text-[9px] text-zinc-400 uppercase">Top-3</div>
              <div className="text-xs font-bold text-emerald-400">
                {(seen.top_3 * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-1.5 rounded bg-bg-deep border border-border-subtle">
              <div className="text-[9px] text-zinc-400 uppercase">Mean Rank</div>
              <div className="text-xs font-bold text-zinc-200">{seen.mean_rank.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Unseen */}
        <div className="p-3 rounded-md bg-bg-surface border border-border-subtle space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-zinc-200 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Held-Out Unseen Faults</span>
            </span>
            <span className="text-[10px] font-mono text-zinc-400">N = {unseen.n_samples}</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-center font-mono">
            <div className="p-1.5 rounded bg-bg-deep border border-border-subtle">
              <div className="text-[9px] text-zinc-400 uppercase">Top-1</div>
              <div className="text-xs font-bold text-blue-400">
                {(unseen.top_1 * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-1.5 rounded bg-bg-deep border border-border-subtle">
              <div className="text-[9px] text-zinc-400 uppercase">Top-3</div>
              <div className="text-xs font-bold text-emerald-400">
                {(unseen.top_3 * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-1.5 rounded bg-bg-deep border border-border-subtle">
              <div className="text-[9px] text-zinc-400 uppercase">Mean Rank</div>
              <div className="text-xs font-bold text-zinc-200">{unseen.mean_rank.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Leave One Template Out */}
      <div className="pt-1">
        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold block mb-1.5">
          Leave-One-Template-Out Validation
        </span>
        <div className="border border-border-subtle rounded-md overflow-hidden bg-bg-deep text-xs font-mono">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border-subtle bg-bg-surface text-zinc-400 text-[9px] uppercase">
                <th className="py-1.5 px-3">Held-Out Template</th>
                <th className="py-1.5 px-3">N (Test)</th>
                <th className="py-1.5 px-3">Train Top-1</th>
                <th className="py-1.5 px-3">Test Top-1</th>
                <th className="py-1.5 px-3">Test Top-3</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {leaveOneOut.map((row) => (
                <tr key={row.held_out_template} className="hover:bg-bg-elevated/40">
                  <td className="py-1.5 px-3 font-semibold text-zinc-200">{row.held_out_template}</td>
                  <td className="py-1.5 px-3 text-zinc-400">{row.n_test}</td>
                  <td className="py-1.5 px-3 text-zinc-400">{(row.train_accuracy_top1 * 100).toFixed(1)}%</td>
                  <td className="py-1.5 px-3 text-blue-400 font-bold">{(row.test_accuracy_top1 * 100).toFixed(1)}%</td>
                  <td className="py-1.5 px-3 text-emerald-400 font-bold">{(row.test_accuracy_top3 * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
