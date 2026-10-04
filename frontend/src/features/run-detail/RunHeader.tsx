import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RotateCcw,
  Sparkles,
  GitCompare,
  ArrowLeft,
  Eye,
  Clock,
  Layers,
  Cpu,
  ShieldAlert,
} from 'lucide-react';
import { Run, Diagnosis } from '../../api/types';
import { StatusBadge } from '../explorer/StatusBadge';

interface RunHeaderProps {
  run: Run;
  diagnosis: Diagnosis | null;
  isDiagnosing: boolean;
  onDiagnose: () => void;
  onOpenReplay: () => void;
  reveal: boolean;
  onToggleReveal: () => void;
}

export const RunHeader: React.FC<RunHeaderProps> = ({
  run,
  diagnosis,
  isDiagnosing,
  onDiagnose,
  onOpenReplay,
  reveal,
  onToggleReveal,
}) => {
  const navigate = useNavigate();

  return (
    <div className="p-5 bg-bg-base border-b border-border-subtle space-y-3.5">
      {/* Top Nav & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/explorer')}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-bg-surface border border-border-subtle transition-colors cursor-pointer"
            title="Back to trace explorer (Esc)"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-mono font-bold text-zinc-100">{run.id}</h1>
              <StatusBadge status={run.status} size="sm" />
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-bg-surface text-zinc-300 border border-border-subtle">
                {run.template}
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-bg-surface text-zinc-400 border border-border-subtle">
                {run.agent_kind}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-500 mt-0.5">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-zinc-600" />
                {run.created_at}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3 text-zinc-600" />
                {run.steps.length} steps recorded
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Reveal Fault Toggle */}
          <button
            onClick={onToggleReveal}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono transition-all border cursor-pointer ${
              reveal
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 font-semibold'
                : 'bg-bg-surface text-zinc-400 hover:text-zinc-200 border-border-subtle'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{reveal ? 'Fault Revealed' : 'Reveal Ground Truth'}</span>
          </button>

          {/* Compare Link */}
          <button
            onClick={() => navigate(`/compare?a=${run.id}`)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono bg-bg-surface hover:bg-bg-elevated text-zinc-300 border border-border-subtle transition-colors cursor-pointer"
          >
            <GitCompare className="w-3.5 h-3.5 text-zinc-400" />
            <span>Compare</span>
          </button>

          {/* Replay Drawer Trigger (Person B integration) */}
          <button
            onClick={onOpenReplay}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-bg-elevated hover:bg-bg-highlight text-zinc-100 font-mono text-xs border border-border-medium transition-all cursor-pointer"
            title="Replay from checkpoint (R)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Replay</span>
            <kbd className="text-[9px] text-zinc-500 font-mono bg-bg-deep px-1 py-0.2 rounded border border-border-subtle">
              R
            </kbd>
          </button>

          {/* Diagnose Button */}
          <button
            onClick={onDiagnose}
            disabled={isDiagnosing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            title="Diagnose run (D)"
          >
            {isDiagnosing ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{diagnosis ? 'Re-diagnose' : 'Diagnose Run'}</span>
            <kbd className="text-[9px] text-blue-200 font-mono bg-blue-700/80 px-1 py-0.2 rounded border border-blue-400/30">
              D
            </kbd>
          </button>
        </div>
      </div>

      {/* Outcome Summary Callout */}
      <div className="p-2.5 rounded-md bg-bg-surface border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="space-y-0.5">
          <span className="font-mono text-zinc-500 text-[10px] uppercase tracking-wider block font-semibold">
            Outcome Summary
          </span>
          <p className="text-zinc-200 font-sans text-xs">{run.outcome_summary}</p>
        </div>

        {reveal && run.fault && (
          <div className="p-2 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 font-mono text-[11px] shrink-0 sm:max-w-md flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-rose-400">GROUND TRUTH FAULT:</span> {run.fault.fault_type} (Step {run.fault.injected_step})
              <p className="text-rose-200/80 mt-0.5 text-[10px]">{run.fault.description}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
