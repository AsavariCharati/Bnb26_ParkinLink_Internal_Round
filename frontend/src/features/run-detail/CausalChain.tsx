import React from 'react';
import { ArrowRight, GitFork, AlertOctagon, CornerDownRight } from 'lucide-react';
import { motion } from 'motion/react';
import { CausalChain as CausalChainType } from '../../api/types';

interface CausalChainProps {
  chain: CausalChainType;
  onSelectStep: (stepIdx: number) => void;
  selectedStepIdx: number;
}

export const CausalChain: React.FC<CausalChainProps> = ({
  chain,
  onSelectStep,
  selectedStepIdx,
}) => {
  if (!chain || !chain.nodes || chain.nodes.length === 0) {
    return (
      <div className="p-5 bg-bg-base border-t border-border-subtle text-xs text-zinc-500 font-mono">
        No causal propagation graph computed. Run diagnosis to uncover causal chain.
      </div>
    );
  }

  return (
    <div className="p-5 bg-bg-surface/30 border-t border-border-subtle space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitFork className="w-3.5 h-3.5 text-blue-400 rotate-90" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200">
            Causal Anomaly Propagation Chain
          </h3>
        </div>
        <span className="text-[10px] font-mono text-zinc-500">
          Click any node to inspect upstream state or downstream blast radius
        </span>
      </div>

      {/* Interactive Node Flow with Motion Stagger */}
      <div className="overflow-x-auto pb-1.5">
        <div className="flex items-stretch gap-2.5 min-w-max">
          {chain.nodes.map((node, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === chain.nodes.length - 1;
            const isSelected = node.step_idx === selectedStepIdx;

            return (
              <React.Fragment key={node.step_idx}>
                {/* Causal Node Card */}
                <motion.button
                  type="button"
                  onClick={() => onSelectStep(node.step_idx)}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.16, delay: idx * 0.04 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-60 p-3 rounded-md border text-left flex flex-col justify-between transition-all duration-120 cursor-pointer ${
                    isSelected
                      ? 'bg-bg-elevated border-blue-500 shadow-md ring-1 ring-blue-500/30 z-10'
                      : isFirst
                      ? 'bg-rose-500/10 border-rose-500/40 hover:bg-rose-500/20'
                      : isLast
                      ? 'bg-amber-500/10 border-amber-500/40 hover:bg-amber-500/20'
                      : 'bg-bg-base border-border-subtle hover:border-border-medium hover:bg-bg-surface'
                  }`}
                >
                  <div className="space-y-1">
                    {/* Step tag & Badge */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-zinc-400">
                        Step #{node.step_idx.toString().padStart(2, '0')}
                      </span>
                      <span
                        className={`text-[8px] font-mono uppercase px-1.5 py-0.2 rounded font-semibold ${
                          isFirst
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : isLast
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-bg-surface text-zinc-400 border border-border-subtle'
                        }`}
                      >
                        {isFirst ? 'Root Cause' : isLast ? 'Terminal Outcome' : 'Dependent Read'}
                      </span>
                    </div>

                    <div className="text-xs font-mono font-semibold text-zinc-100 truncate">
                      {node.step_name}
                    </div>

                    <p className="text-[10px] font-sans text-zinc-300 leading-snug">
                      {node.description}
                    </p>
                  </div>

                  {/* Variables and State Diff */}
                  <div className="mt-2 pt-1.5 border-t border-border-subtle space-y-0.5 font-mono text-[10px]">
                    {node.variable_affected && (
                      <div className="truncate text-zinc-400">
                        <span className="text-zinc-500">var: </span>
                        <span className="text-blue-300 font-semibold">{node.variable_affected}</span>
                      </div>
                    )}
                    {node.state_diff && (
                      <div className="truncate text-zinc-400">
                        <span className="text-zinc-500">delta: </span>
                        <span className="text-amber-300 font-semibold">{node.state_diff}</span>
                      </div>
                    )}
                  </div>
                </motion.button>

                {/* Connecting Arrow with step index */}
                {!isLast && (
                  <div className="flex items-center text-zinc-600 shrink-0">
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Terminal Outcome Callout */}
      <div className="p-2.5 rounded-md bg-rose-500/10 border border-rose-500/25 flex items-center gap-2 text-xs font-mono text-rose-300">
        <AlertOctagon className="w-3.5 h-3.5 text-rose-400 shrink-0" />
        <span>
          <strong className="text-rose-200">Terminal Outcome Impact:</strong> {chain.final_impact}
        </span>
      </div>
    </div>
  );
};
