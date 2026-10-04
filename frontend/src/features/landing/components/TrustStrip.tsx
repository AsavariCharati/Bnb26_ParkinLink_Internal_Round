import React from 'react';
import { Layers, GitFork, RotateCcw, ShieldCheck, BarChart3 } from 'lucide-react';

export const TrustStrip: React.FC = () => {
  const capabilities = [
    { label: 'Execution Traces', icon: Layers },
    { label: 'Causal Anomaly BFS', icon: GitFork },
    { label: 'Deterministic Replay', icon: RotateCcw },
    { label: 'Evidence-Based Attribution', icon: ShieldCheck },
    { label: 'Benchmark Evaluation', icon: BarChart3 },
  ];

  return (
    <div className="border-y border-border-subtle bg-bg-base/60 py-6">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-4 font-semibold">
          Architected For Engineering & Agent Reliability Teams
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-mono text-zinc-400">
          {capabilities.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex items-center gap-2 hover:text-zinc-200 transition-colors"
              >
                <Icon className="w-3.5 h-3.5 text-zinc-500" />
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
