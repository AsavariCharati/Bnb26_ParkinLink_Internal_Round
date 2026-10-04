import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Wrench,
  Activity,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Diagnosis } from '../../api/types';
import { EvidenceTable } from './EvidenceTable';

interface DiagnosisCardProps {
  diagnosis: Diagnosis;
  onSelectStep: (idx: number) => void;
}

export const DiagnosisCard: React.FC<DiagnosisCardProps> = ({
  diagnosis,
  onSelectStep,
}) => {
  return (
    <div className="p-5 bg-bg-base border-l border-border-subtle space-y-4">
      {/* Diagnosis Header */}
      <div className="flex items-start justify-between border-b border-border-subtle pb-3">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <h2 className="text-xs font-mono font-bold text-zinc-100 uppercase tracking-wider">
              Diagnostic Attribution
            </h2>
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5 font-sans">
            Attribution based on causal state divergence and baseline anomalies
          </p>
        </div>

        <button
          onClick={() => onSelectStep(diagnosis.suspect_step)}
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-mono transition-colors cursor-pointer"
        >
          <span>Focus Step #{diagnosis.suspect_step}</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Suspect & Blame Metric */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-2.5 rounded-md bg-bg-surface border border-border-subtle space-y-0.5">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block font-semibold">
            Root Suspect
          </span>
          <div className="text-xs font-mono font-bold text-rose-400">
            Step {diagnosis.suspect_step} · {diagnosis.suspect_step_name}
          </div>
        </div>

        <div className="p-2.5 rounded-md bg-bg-surface border border-border-subtle space-y-0.5">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block font-semibold">
            Relative Blame Score
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-zinc-100">
              {diagnosis.relative_blame.toFixed(2)}
            </span>
            <div className="flex-1 bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, diagnosis.relative_blame * 100)}%` }}
                transition={{ duration: 0.3 }}
                className="bg-rose-500 h-full rounded-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Why This Step? Reasoning */}
      <div className="p-3 rounded-md bg-bg-deep border border-border-subtle space-y-1.5 text-xs font-mono">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold block">
          Attribution Rationale
        </span>
        <ul className="space-y-1 text-[11px] text-zinc-300">
          <li className="flex items-start gap-1.5">
            <span className="text-rose-400 font-bold">•</span>
            <span>Unexpected state/output divergence detected during step execution</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-amber-400 font-bold">•</span>
            <span>Downstream dependent steps consumed modified variables</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-blue-400 font-bold">•</span>
            <span>Terminal outcome diverged systematically following this anomaly</span>
          </li>
        </ul>
      </div>

      {/* Evidence Hierarchy */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold block">
          Observable Diagnostic Evidence
        </span>
        <EvidenceTable evidence={diagnosis.evidence} />
      </div>

      {/* Healthy Reference Comparison */}
      {diagnosis.healthy_reference && (
        <div className="space-y-1.5 pt-1 border-t border-border-subtle">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Nominal Execution Reference</span>
          </span>
          <div className="p-2.5 rounded-md bg-bg-deep border border-border-subtle text-[11px] font-mono text-zinc-300">
            <pre className="whitespace-pre-wrap">{JSON.stringify(diagnosis.healthy_reference, null, 2)}</pre>
          </div>
        </div>
      )}

      {/* Suggested Patch Recommendation */}
      {diagnosis.suggested_patch && (
        <div className="p-3 rounded-md bg-blue-500/10 border border-blue-500/30 text-xs text-blue-200 space-y-1 font-mono">
          <div className="flex items-center gap-1.5 font-bold text-blue-300 text-[10px] uppercase">
            <Wrench className="w-3 h-3" />
            <span>Remediation Recommendation</span>
          </div>
          <p className="text-[11px] text-blue-100/90 leading-relaxed">{diagnosis.suggested_patch}</p>
        </div>
      )}
    </div>
  );
};
