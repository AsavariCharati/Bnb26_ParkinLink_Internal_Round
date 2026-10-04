import React from 'react';
import { ArrowRight, ShieldCheck, Database, GitBranch, AlertTriangle } from 'lucide-react';

export const EvidenceSection: React.FC = () => {
  return (
    <section className="py-24 bg-bg-deep border-b border-border-subtle">
      <div className="max-w-6xl mx-auto px-6 space-y-12">
        {/* Header */}
        <div className="max-w-3xl space-y-3">
          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
            EMPIRICAL EVIDENCE
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-zinc-100 font-sans">
            Don't trust a guess. <br />
            <span className="text-zinc-400">Follow the evidence.</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-sans leading-relaxed">
            Black Box does not merely output an opaque AI prediction. Every diagnostic attribution is backed by concrete state divergences, variable fanouts, and downstream causality.
          </p>
        </div>

        {/* Evidence Pipeline Flow */}
        <div className="p-6 rounded-xl bg-bg-base border border-border-subtle space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 font-mono text-xs">
            {/* 1. Suspect Mutation */}
            <div className="p-3 rounded bg-bg-surface border border-rose-500/30 space-y-1.5">
              <div className="text-[9px] uppercase text-rose-400 font-bold">1. Root Suspect</div>
              <div className="font-semibold text-zinc-200">step_03 Anomaly</div>
              <p className="text-[10px] text-zinc-400 font-sans">Missing conversion divisor</p>
            </div>

            {/* 2. State Delta */}
            <div className="p-3 rounded bg-bg-surface border border-border-subtle space-y-1.5">
              <div className="text-[9px] uppercase text-amber-400 font-bold">2. State Mutation</div>
              <div className="font-semibold text-zinc-200">Poisoned Value</div>
              <p className="text-[10px] text-zinc-400 font-sans">54,000 written to quote map</p>
            </div>

            {/* 3. Downstream Read */}
            <div className="p-3 rounded bg-bg-surface border border-border-subtle space-y-1.5">
              <div className="text-[9px] uppercase text-blue-400 font-bold">3. Downstream Read</div>
              <div className="font-semibold text-zinc-200">step_05 Fanout</div>
              <p className="text-[10px] text-zinc-400 font-sans">Min-selector evaluates 54,000</p>
            </div>

            {/* 4. Causal Impact */}
            <div className="p-3 rounded bg-bg-surface border border-border-subtle space-y-1.5">
              <div className="text-[9px] uppercase text-purple-400 font-bold">4. Causal Blast</div>
              <div className="font-semibold text-zinc-200">Decision Inversion</div>
              <p className="text-[10px] text-zinc-400 font-sans">VendorB disqualified falsely</p>
            </div>

            {/* 5. Terminal Outcome */}
            <div className="p-3 rounded bg-bg-surface border border-rose-500/40 space-y-1.5">
              <div className="text-[9px] uppercase text-rose-400 font-bold">5. Terminal Failure</div>
              <div className="font-semibold text-rose-300">FAILED Result</div>
              <p className="text-[10px] text-zinc-400 font-sans">Customer overpays by $90/mo</p>
            </div>
          </div>

          <div className="p-3 rounded bg-bg-surface/60 border border-border-subtle text-xs font-mono text-zinc-400 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Full trajectory reproducibility guaranteed across all recorded sessions</span>
            </span>
            <span className="text-[11px] text-zinc-500">Deterministic trace</span>
          </div>
        </div>
      </div>
    </section>
  );
};
