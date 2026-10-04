import React from 'react';
import { BookOpen, ShieldCheck, CheckSquare, Filter } from 'lucide-react';

interface TestingMethodCardProps {
  methodology: Record<string, string>;
}

export const TestingMethodCard: React.FC<TestingMethodCardProps> = ({ methodology }) => {
  return (
    <div className="p-4 rounded-lg bg-bg-base border border-border-subtle space-y-3">
      <div className="flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-blue-400" />
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">
          Evaluation Methodology & Validation Rigor
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs font-mono">
        <div className="p-3 rounded-md bg-bg-surface border border-border-subtle space-y-1">
          <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] uppercase font-semibold">
            <Filter className="w-3 h-3 text-blue-400" />
            <span>Grouped K-Fold Split</span>
          </div>
          <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
            {methodology.split_strategy ||
              'GroupKFold partitioned strictly by agent template to prevent cross-template data leakage.'}
          </p>
        </div>

        <div className="p-3 rounded-md bg-bg-surface border border-border-subtle space-y-1">
          <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] uppercase font-semibold">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Label Validation</span>
          </div>
          <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
            {methodology.label_validation ||
              'Automated replay verification ensuring fault removal systematically restores PASSED outcome.'}
          </p>
        </div>

        <div className="p-3 rounded-md bg-bg-surface border border-border-subtle space-y-1">
          <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] uppercase font-semibold">
            <CheckSquare className="w-3 h-3 text-amber-400" />
            <span>Demo Data Isolation</span>
          </div>
          <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
            {methodology.demo_isolation ||
              'All interactive walkthrough traces strictly held out from training and optimization partitions.'}
          </p>
        </div>
      </div>
    </div>
  );
};
