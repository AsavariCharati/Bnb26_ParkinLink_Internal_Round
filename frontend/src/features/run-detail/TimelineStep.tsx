import React from 'react';
import {
  Compass,
  Cpu,
  Wrench,
  Search,
  FileCode,
  Flag,
  AlertTriangle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Step, StepType, BlameScore } from '../../api/types';

interface TimelineStepProps {
  step: Step;
  isSelected: boolean;
  isSuspect: boolean;
  blameScore?: BlameScore;
  onClick: () => void;
  isLast: boolean;
}

const STEP_ICONS: Record<StepType, React.ElementType> = {
  plan: Compass,
  llm_call: Cpu,
  tool_call: Wrench,
  retrieval: Search,
  parse: FileCode,
  final_answer: Flag,
};

export const TimelineStep: React.FC<TimelineStepProps> = ({
  step,
  isSelected,
  isSuspect,
  blameScore,
  onClick,
  isLast,
}) => {
  const Icon = STEP_ICONS[step.step_type] || Cpu;
  const hasBlame = blameScore !== undefined && blameScore.score > 0.05;

  return (
    <div className="flex items-center shrink-0">
      {/* Step Card */}
      <motion.button
        type="button"
        onClick={onClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`group relative flex flex-col items-center p-2.5 rounded-md border text-left outline-none cursor-pointer transition-colors duration-120 select-none min-w-[124px] ${
          isSelected
            ? 'bg-bg-elevated border-blue-500 shadow-md ring-1 ring-blue-500/40 z-10'
            : isSuspect
            ? 'bg-rose-500/10 border-rose-500/50 hover:bg-rose-500/20'
            : step.error_flag
            ? 'bg-amber-500/10 border-amber-500/40 hover:bg-amber-500/20'
            : 'bg-bg-base border-border-subtle hover:border-border-medium hover:bg-bg-surface'
        }`}
      >
        {/* Suspect Tag */}
        {isSuspect && (
          <span className="absolute -top-2 px-1.5 py-0.2 rounded bg-rose-500 text-white font-mono text-[8px] font-bold tracking-wider uppercase shadow animate-pulse">
            Root Suspect
          </span>
        )}

        <div className="flex items-center gap-1.5 mb-1 w-full justify-between">
          <div
            className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
              isSuspect
                ? 'bg-rose-500/20 text-rose-400'
                : step.error_flag
                ? 'bg-amber-500/20 text-amber-400'
                : isSelected
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-bg-surface text-zinc-400 group-hover:text-zinc-200'
            }`}
          >
            <Icon className="w-3 h-3" />
          </div>

          <span className="text-[10px] font-mono text-zinc-500 group-hover:text-zinc-400">
            #{step.step_idx.toString().padStart(2, '0')}
          </span>
        </div>

        {/* Step Name */}
        <div className="text-xs font-mono font-semibold text-zinc-200 truncate w-full text-left">
          {step.step_name}
        </div>

        {/* Step Type */}
        <div className="text-[10px] font-mono text-zinc-500 capitalize w-full text-left truncate">
          {step.step_type.replace('_', ' ')}
        </div>

        {/* Relative Blame Score Bar (After diagnosis) */}
        {blameScore !== undefined ? (
          <div className="mt-2 w-full pt-1 border-t border-border-subtle">
            <div className="text-[10px] font-mono flex items-center justify-between">
              <span className="text-zinc-500 text-[9px]">blame</span>
              <span
                className={`font-semibold ${
                  isSuspect ? 'text-rose-400' : hasBlame ? 'text-amber-400' : 'text-zinc-500'
                }`}
              >
                {blameScore.score.toFixed(2)}
              </span>
            </div>
            <div className="w-full bg-zinc-800 h-1 rounded-full mt-0.5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.max(6, blameScore.score * 100))}%` }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className={`h-full rounded-full ${
                  isSuspect ? 'bg-rose-500' : hasBlame ? 'bg-amber-500' : 'bg-zinc-600'
                }`}
              />
            </div>
          </div>
        ) : (
          <div className="mt-1.5 w-full pt-1 border-t border-border-subtle/50 flex items-center justify-between text-[10px] font-mono text-zinc-500">
            <span>{step.latency_ms ? `${step.latency_ms.toFixed(0)}ms` : '—'}</span>
            {step.error_flag && <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />}
          </div>
        )}
      </motion.button>

      {/* Connecting Trace Segment */}
      {!isLast && (
        <div className="w-6 h-[2px] bg-border-medium group-hover:bg-border-focused transition-colors mx-0.5 shrink-0" />
      )}
    </div>
  );
};
