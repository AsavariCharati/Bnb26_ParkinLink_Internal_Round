import React from 'react';
import { AlertCircle, CheckCircle2, ArrowRight, ArrowDown } from 'lucide-react';
import { motion } from 'motion/react';

export const ProblemSection: React.FC = () => {
  return (
    <section className="py-24 bg-bg-deep border-b border-border-subtle">
      <div className="max-w-6xl mx-auto px-6 space-y-12">
        {/* Section Header */}
        <div className="max-w-3xl space-y-3">
          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
            THE OBSERVABILITY GAP
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-zinc-100 font-sans">
            AI can generate the answer. <br />
            <span className="text-zinc-400">Can you explain the answer?</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-sans leading-relaxed pt-1">
            Standard logging captures final strings, but fails to isolate which
            intermediate tool call, state mutation, or currency divisor silently corrupted
            downstream decisions.
          </p>
        </div>

        {/* Visual Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Traditional Logs Card */}
          <div className="p-6 rounded-xl bg-bg-base border border-border-subtle space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <span className="text-zinc-400 font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                Traditional Flat Logs
              </span>
              <span className="text-[10px] text-zinc-600 uppercase">Opaque</span>
            </div>

            <div className="space-y-2 text-[11px] text-zinc-400">
              <div className="p-2.5 rounded bg-bg-deep border border-border-subtle text-zinc-500">
                [INFO] Agent received user query: "Find cheapest DB"
              </div>
              <div className="flex justify-center text-zinc-700">↓</div>
              <div className="p-2.5 rounded bg-bg-deep border border-border-subtle text-zinc-500">
                [INFO] LLM reasoning completed (duration: 3.4s)
              </div>
              <div className="flex justify-center text-zinc-700">↓</div>
              <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300">
                [ERROR] Suboptimal recommendation emitted. (Root cause: unknown)
              </div>
            </div>

            <p className="text-[11px] text-zinc-500 font-sans pt-2 border-t border-border-subtle">
              No variable provenance, no state mutation diffs, and no way to prove which step caused the failure.
            </p>
          </div>

          {/* Black Box Observable Trajectory Card */}
          <div className="p-6 rounded-xl bg-bg-base border border-blue-500/30 shadow-lg space-y-4 font-mono text-xs ring-1 ring-blue-500/20">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <span className="text-zinc-100 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-400" />
                Black Box Causal Tracing
              </span>
              <span className="text-[10px] text-blue-400 font-bold uppercase">Evidence-Backed</span>
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="p-2 rounded bg-bg-surface border border-border-subtle flex items-center justify-between text-zinc-300">
                <span>01 Execution Trace Recorded</span>
                <span className="text-[10px] text-zinc-500">7 steps</span>
              </div>
              <div className="flex justify-center text-blue-500/50">↓</div>
              <div className="p-2 rounded bg-rose-500/10 border border-rose-500/40 flex items-center justify-between text-rose-300">
                <span>02 Suspect Step Isolated (step_03)</span>
                <span className="text-[10px] text-rose-400 font-bold">blame: 0.62</span>
              </div>
              <div className="flex justify-center text-blue-500/50">↓</div>
              <div className="p-2 rounded bg-bg-surface border border-border-subtle flex items-center justify-between text-amber-300">
                <span>03 Downstream Blast Radius Mapped</span>
                <span className="text-[10px] text-amber-400">4 reads poisoned</span>
              </div>
              <div className="flex justify-center text-blue-500/50">↓</div>
              <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-emerald-300">
                <span>04 Checkpoint Replay Proves Fix</span>
                <span className="text-[10px] text-emerald-400 font-bold">PASSED</span>
              </div>
            </div>

            <p className="text-[11px] text-zinc-400 font-sans pt-2 border-t border-border-subtle">
              Complete state provenance, evidence-backed diagnostic attribution, and verifiable outcome proofs.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
