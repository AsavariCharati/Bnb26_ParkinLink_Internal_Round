import React from 'react';
import { ListFilter, Sparkles, GitFork, RotateCcw, Check, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export const CapabilitySection: React.FC = () => {
  const capabilities = [
    {
      num: '01',
      title: 'Explore & Inspect',
      tagline: 'See the complete execution trace.',
      description:
        'Inspect prompts, tool parameters, latency, token consumption, and state mutations across every individual execution node.',
      badge: 'Trace Timeline',
      uiFragment: (
        <div className="p-3 bg-bg-deep rounded border border-border-subtle font-mono text-[10px] space-y-1.5 text-zinc-300">
          <div className="flex items-center justify-between text-zinc-500">
            <span>STEP #02 • tool_call</span>
            <span className="text-zinc-600">310ms</span>
          </div>
          <div className="text-blue-300 font-semibold">tool: query_pricing_api</div>
          <div className="text-zinc-400">output: quotes: {`{ VendorA: 450, VendorB: 54000 }`}</div>
        </div>
      ),
    },
    {
      num: '02',
      title: 'Diagnose & Blame',
      tagline: 'Identify the root suspect step with evidence.',
      description:
        'Deterministic diagnostic attribution isolates intermediate anomalies and ranks steps by relative blame score without guesswork.',
      badge: 'Relative Blame Score',
      uiFragment: (
        <div className="p-3 bg-bg-deep rounded border border-rose-500/30 font-mono text-[10px] space-y-1 text-zinc-300">
          <div className="flex items-center justify-between">
            <span className="text-rose-400 font-bold">SUSPECT: step_03</span>
            <span className="text-rose-400 font-bold">blame: 0.62</span>
          </div>
          <div className="text-zinc-400">Currency normalization missing divisor</div>
        </div>
      ),
    },
    {
      num: '03',
      title: 'Understand Causality',
      tagline: 'Follow downstream variable poisoning.',
      description:
        'Breadth-first causal graph tracks the propagation of modified state variables through downstream reads to final failure.',
      badge: 'BFS Dependency Graph',
      uiFragment: (
        <div className="p-3 bg-bg-deep rounded border border-border-subtle font-mono text-[10px] space-y-1 text-zinc-300">
          <div className="text-amber-300 font-semibold">var: normalized_quotes (54000)</div>
          <div className="flex items-center gap-1 text-zinc-400">
            <span>step_03</span>
            <span>→</span>
            <span>step_05 min_selector</span>
            <span>→</span>
            <span className="text-rose-400 font-bold">failed</span>
          </div>
        </div>
      ),
    },
    {
      num: '04',
      title: 'Replay & Prove',
      tagline: 'Prove whether the patch changes the outcome.',
      description:
        'Fork execution from any checkpoint, apply state or prompt patches, and systematically verify outcome remediation.',
      badge: 'Outcome Proof Engine',
      uiFragment: (
        <div className="p-3 bg-bg-deep rounded border border-emerald-500/30 font-mono text-[10px] space-y-1 text-zinc-300">
          <div className="flex items-center gap-2">
            <span className="text-rose-400 line-through">FAILED</span>
            <span>→</span>
            <span className="text-emerald-400 font-bold">PASSED</span>
          </div>
          <div className="text-emerald-300">Outcome verified with VendorB ($360)</div>
        </div>
      ),
    },
  ];

  return (
    <section id="capabilities" className="py-24 bg-bg-base border-b border-border-subtle">
      <div className="max-w-6xl mx-auto px-6 space-y-14">
        {/* Section Header */}
        <div className="max-w-3xl space-y-3">
          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
            ENGINEERING CAPABILITIES
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-zinc-100 font-sans">
            From trace to explanation.
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-sans leading-relaxed">
            A comprehensive developer toolkit for inspecting agent execution, attributing fault causality, and proving fixes.
          </p>
        </div>

        {/* 4 Capability Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {capabilities.map((cap) => (
            <div
              key={cap.num}
              className="p-6 rounded-xl bg-bg-surface/50 border border-border-subtle hover:border-border-medium transition-all duration-150 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-xs font-bold text-zinc-500">#{cap.num}</span>
                  <span className="text-[9px] uppercase px-2 py-0.5 rounded bg-bg-elevated text-zinc-400 border border-border-subtle">
                    {cap.badge}
                  </span>
                </div>
                <h3 className="text-base font-bold text-zinc-100 font-sans">{cap.title}</h3>
                <p className="text-xs text-zinc-400 font-sans leading-relaxed">{cap.description}</p>
              </div>

              {/* UI Fragment */}
              <div className="pt-2">{cap.uiFragment}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
