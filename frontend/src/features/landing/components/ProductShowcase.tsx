import React, { useState } from 'react';
import { Layers, Sparkles, GitFork, RotateCcw, ArrowRight, CheckCircle2, AlertOctagon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ProductShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'trace' | 'diagnose' | 'causality' | 'replay'>('trace');

  const tabs = [
    { id: 'trace', label: '1. Trace Inspection', icon: Layers },
    { id: 'diagnose', label: '2. Diagnostic Blame', icon: Sparkles },
    { id: 'causality', label: '3. Causal Blast Radius', icon: GitFork },
    { id: 'replay', label: '4. Replay Proof', icon: RotateCcw },
  ] as const;

  return (
    <section id="showcase" className="py-24 bg-bg-deep border-b border-border-subtle">
      <div className="max-w-6xl mx-auto px-6 space-y-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
            INTERACTIVE DEMONSTRATION
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-zinc-100 font-sans">
            Experience the diagnostic workflow.
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-sans">
            Step through how Black Box isolates, attributes, and proves resolution of a real currency conversion anomaly.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-wrap items-center justify-center gap-2 font-mono text-xs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-md transition-all cursor-pointer ${
                  isActive
                    ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-md'
                    : 'bg-bg-surface text-zinc-400 hover:text-zinc-200 border border-border-subtle hover:bg-bg-elevated'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Interactive Window */}
        <div className="max-w-4xl mx-auto rounded-xl bg-bg-base border border-border-medium shadow-2xl overflow-hidden font-mono text-xs">
          {/* Mock Window Top Bar */}
          <div className="px-4 py-2 bg-bg-surface border-b border-border-subtle flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] text-zinc-400">
              <span className="text-zinc-600">run_0142</span>
              <span>/</span>
              <span className="text-zinc-200 font-bold uppercase">{activeTab}</span>
            </div>
            <div className="text-[10px] text-zinc-500">
              Trace: price_compare (simulated)
            </div>
          </div>

          {/* Window Body with Animated Transitions */}
          <div className="p-6 bg-bg-deep min-h-[280px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {activeTab === 'trace' && (
                <motion.div
                  key="trace"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.16 }}
                  className="w-full space-y-3"
                >
                  <div className="text-zinc-400 text-xs flex items-center justify-between pb-1 border-b border-border-subtle">
                    <span className="font-semibold text-zinc-200">Execution Timeline & Step Sequence</span>
                    <span className="text-zinc-500">7 recorded steps</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div className="p-2.5 rounded bg-bg-surface border border-border-subtle">
                      <div className="text-zinc-500">#01 • plan</div>
                      <div className="font-semibold text-zinc-300">intent_planner</div>
                      <div className="text-[10px] text-zinc-500 mt-1">120ms • 85 tok</div>
                    </div>
                    <div className="p-2.5 rounded bg-bg-surface border border-border-subtle">
                      <div className="text-zinc-500">#02 • tool</div>
                      <div className="font-semibold text-zinc-300">vendor_retrieval</div>
                      <div className="text-[10px] text-zinc-500 mt-1">310ms • 140 tok</div>
                    </div>
                    <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/40 text-rose-300">
                      <div className="text-rose-400 font-bold">#03 • llm (Suspect)</div>
                      <div className="font-semibold">currency_normalizer</div>
                      <div className="text-[10px] text-rose-400/80 mt-1">420ms • 210 tok</div>
                    </div>
                    <div className="p-2.5 rounded bg-bg-surface border border-border-subtle">
                      <div className="text-zinc-500">#07 • final</div>
                      <div className="font-semibold text-rose-300">final_answer</div>
                      <div className="text-[10px] text-zinc-500 mt-1">FAILED status</div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'diagnose' && (
                <motion.div
                  key="diagnose"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.16 }}
                  className="w-full space-y-4"
                >
                  <div className="flex items-center justify-between p-3 rounded bg-bg-surface border border-rose-500/30">
                    <div>
                      <span className="text-rose-400 font-bold block text-sm">
                        ROOT SUSPECT: Step #03 (currency_normalizer)
                      </span>
                      <span className="text-zinc-400 text-[11px]">
                        Relative blame score attribution: 0.62 / 1.00
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-rose-500 text-white font-bold text-[10px]">
                      HIGH CONFIDENCE ATTRIBUTION
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-[11px]">
                    <div className="p-2.5 rounded bg-bg-surface border border-border-subtle">
                      <span className="text-zinc-500 uppercase text-[9px] block">Observed Output</span>
                      <span className="text-rose-400 font-bold">VendorB: $54,000 USD</span>
                    </div>
                    <div className="p-2.5 rounded bg-bg-surface border border-border-subtle">
                      <span className="text-zinc-500 uppercase text-[9px] block">Expected Nominal</span>
                      <span className="text-emerald-400 font-bold">VendorB: $360 USD (54000/150)</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'causality' && (
                <motion.div
                  key="causality"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.16 }}
                  className="w-full space-y-3"
                >
                  <div className="text-zinc-400 text-xs font-semibold pb-1 border-b border-border-subtle">
                    BFS Anomaly Propagation Flow
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-3 bg-bg-surface rounded border border-border-subtle text-[11px]">
                    <div className="p-2 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-center">
                      <div className="font-bold">Step 03</div>
                      <div className="text-[10px] text-zinc-400">Poisoned Quotes</div>
                    </div>
                    <span className="text-zinc-500">→</span>
                    <div className="p-2 rounded bg-bg-deep border border-border-subtle text-amber-300 text-center">
                      <div className="font-bold">Step 05 Selector</div>
                      <div className="text-[10px] text-zinc-400">Reads $54k quote</div>
                    </div>
                    <span className="text-zinc-500">→</span>
                    <div className="p-2 rounded bg-bg-deep border border-border-subtle text-zinc-300 text-center">
                      <div className="font-bold">Step 06 Synthesizer</div>
                      <div className="text-[10px] text-zinc-400">Rejects VendorB</div>
                    </div>
                    <span className="text-zinc-500">→</span>
                    <div className="p-2 rounded bg-rose-500/10 border border-rose-500/40 text-rose-400 text-center">
                      <div className="font-bold">Step 07 Final</div>
                      <div className="text-[10px] text-rose-300">Suboptimal Choice</div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'replay' && (
                <motion.div
                  key="replay"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.16 }}
                  className="w-full space-y-3"
                >
                  <div className="p-4 rounded bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Checkpoint Replay Verified Outcome Fix
                      </span>
                      <span className="text-emerald-300 text-[10px] font-bold">PASSED</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-bg-deep rounded border border-border-subtle text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-rose-400 line-through font-bold">Original: FAILED</span>
                        <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="text-emerald-400 font-bold">Replayed: PASSED</span>
                      </div>
                      <span className="text-zinc-400 text-[10px]">Optimal VendorB selected ($360/mo)</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};
