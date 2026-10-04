import React from 'react';
import { Step, Diagnosis } from '../../api/types';
import { TimelineStep } from './TimelineStep';

interface TimelineProps {
  steps: Step[];
  selectedStepIdx: number;
  onSelectStep: (idx: number) => void;
  diagnosis: Diagnosis | null;
}

export const Timeline: React.FC<TimelineProps> = ({
  steps,
  selectedStepIdx,
  onSelectStep,
  diagnosis,
}) => {
  const blameMap = React.useMemo(() => {
    if (!diagnosis) return new Map();
    return new Map(diagnosis.blame_ranking.map((b) => [b.step_idx, b]));
  }, [diagnosis]);

  const suspectIdx = diagnosis?.suspect_step;

  return (
    <div className="bg-bg-surface/40 border-b border-border-subtle px-5 py-3.5 overflow-x-auto">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
            Execution Timeline
          </span>
          {diagnosis && (
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-bg-elevated text-blue-300 border border-border-subtle">
              attribution active
            </span>
          )}
        </div>
        <div className="text-[10px] font-mono text-zinc-500 flex items-center gap-2">
          <span>
            Step <strong>{selectedStepIdx}</strong> of {steps.length}
          </span>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-400 font-mono">Use [←] [→] to navigate</span>
        </div>
      </div>

      {/* Horizontal Step Sequence */}
      <div className="flex items-center min-w-max py-1.5 px-0.5">
        {steps.map((step, idx) => {
          const isSelected = step.step_idx === selectedStepIdx;
          const isSuspect = step.step_idx === suspectIdx;
          const blameScore = blameMap.get(step.step_idx);

          return (
            <TimelineStep
              key={step.step_idx}
              step={step}
              isSelected={isSelected}
              isSuspect={isSuspect}
              blameScore={blameScore}
              onClick={() => onSelectStep(step.step_idx)}
              isLast={idx === steps.length - 1}
            />
          );
        })}
      </div>
    </div>
  );
};
