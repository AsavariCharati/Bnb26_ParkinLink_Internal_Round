import React, { useState } from 'react';
import {
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { HeroExecutionBackground } from './HeroExecutionBackground';
import { useNavTransition } from '../../../app/useNavTransition';

export const Hero: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(3);
  const { navigateTo, smoothScrollTo } = useNavTransition();

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-[#08090A]">
      {/* Animated execution-trace background */}
      <HeroExecutionBackground />


      <div className="relative max-w-6xl mx-auto px-6 text-center space-y-8">
        {/* Announcement Bar */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bg-surface border border-border-medium text-xs font-mono text-zinc-300 shadow-sm"
        >
          <span className="px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-400 font-bold text-[9px] uppercase">
            NEW
          </span>
          <span className="text-zinc-300">Evidence-backed agent debugging &amp; replay</span>
          <ArrowRight className="w-3 h-3 text-zinc-500" />
        </motion.div>

        {/* Large Editorial Hero Heading */}
        <div className="space-y-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.05 }}
            className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 font-semibold"
          >
            AI Agent Observability &amp; Diagnostic Engine
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-zinc-100 font-sans leading-[1.08]"
          >
            See why your <br className="hidden sm:inline" />
            <span className="text-zinc-400">AI agent failed.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.15 }}
            className="text-sm sm:text-base md:text-lg text-zinc-400 max-w-2xl mx-auto font-sans leading-relaxed pt-2"
          >
            Black Box turns complex agent execution traces into evidence-backed
            diagnoses, causal anomaly chains, and replayable outcome proofs.
          </motion.p>
        </div>

        {/* CTA Actions */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-3 pt-2"
        >
          {/* Route-changing — fires nav signal */}
          <button
            onClick={(e) => navigateTo('/explorer', e)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-semibold shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer border-0"
          >
            <span>Open Explorer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Anchor — smooth scroll, no route change */}
          <button
            onClick={(e) => smoothScrollTo('how-it-works', e)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-bg-surface hover:bg-bg-elevated text-zinc-300 border border-border-subtle text-xs font-mono transition-colors cursor-pointer border"
          >
            <span>See How It Works</span>
          </button>
        </motion.div>

        {/* HERO VISUAL: Actual Black Box Interactive Trace Interface */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.25 }}
          className="pt-6 max-w-5xl mx-auto"
        >
          <div className="rounded-xl bg-bg-base border border-border-medium shadow-2xl overflow-hidden text-left font-mono">
            {/* Mock Window Header */}
            <div className="px-4 py-2.5 bg-bg-surface/80 border-b border-border-subtle flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                </div>
                <span className="text-zinc-600 text-[10px] pl-2 font-mono">
                  blackbox-inspect // trace_run_0142
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                  ● FAILED
                </span>
                <span className="text-zinc-400">template: price_compare</span>
              </div>
            </div>

            {/* Trace Timeline */}
            <div className="p-4 bg-bg-surface/30 border-b border-border-subtle overflow-x-auto">
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2 font-semibold flex items-center justify-between">
                <span>Execution Timeline (Click to inspect)</span>
                <span className="text-amber-400">Attribution: step_03 (blame: 0.62)</span>
              </div>

              <div className="flex items-center gap-1.5 min-w-max py-1">
                {[
                  { idx: 1, name: 'intent_planner', type: 'plan' },
                  { idx: 2, name: 'vendor_retrieval', type: 'tool_call' },
                  { idx: 3, name: 'currency_normalizer', type: 'llm_call', suspect: true, blame: 0.62 },
                  { idx: 4, name: 'tier_filter', type: 'parse' },
                  { idx: 5, name: 'min_cost_selector', type: 'tool_call' },
                  { idx: 6, name: 'contract_synth', type: 'llm_call' },
                  { idx: 7, name: 'final_answer', type: 'final_answer', error: true },
                ].map((s) => (
                  <button
                    key={s.idx}
                    type="button"
                    onClick={() => setActiveStep(s.idx)}
                    className={`p-2 rounded border text-left transition-all ${
                      activeStep === s.idx
                        ? 'bg-bg-elevated border-blue-500 shadow ring-1 ring-blue-500/30'
                        : s.suspect
                        ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                        : s.error
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                        : 'bg-bg-base border-border-subtle text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] text-zinc-500">#{s.idx}</span>
                      {s.suspect && (
                        <span className="text-[7px] uppercase font-bold bg-rose-500 text-white px-1 rounded">
                          Suspect
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-semibold text-zinc-200 mt-0.5">{s.name}</div>
                    {s.blame && (
                      <div className="text-[9px] text-rose-400 mt-1">blame: {s.blame}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Split: Step Inspector + Diagnosis Result */}
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border-subtle bg-bg-base/60 text-xs">
              {/* Step Info */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-500 font-bold">STEP #{activeStep.toString().padStart(2, '0')}</span>
                    <span className="text-zinc-200 font-semibold">
                      {activeStep === 3 ? 'currency_normalizer' : activeStep === 2 ? 'vendor_retrieval' : 'final_answer'}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500">420ms • 210 tok</span>
                </div>

                <div className="p-2.5 rounded bg-bg-deep border border-border-subtle text-[11px] text-zinc-300 space-y-1">
                  <div className="text-zinc-500 text-[10px] uppercase">State Delta Mutation</div>
                  <pre className="text-amber-300 font-mono">
                    {activeStep === 3
                      ? 'normalized_quotes: { VendorB: 54000 } // Error: 150 divisor missing'
                      : 'raw_quotes_received: true'}
                  </pre>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                  <span>Reads: [vendor_quotes]</span>
                  <span>•</span>
                  <span>Writes: [normalized_quotes]</span>
                </div>
              </div>

              {/* Diagnosis Evidence & Causal Chain */}
              <div className="p-4 space-y-3 bg-bg-surface/20">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase text-zinc-400 font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    Diagnostic Attribution
                  </span>
                  <span className="text-[10px] text-rose-400 font-bold">Relative Blame: 0.62</span>
                </div>

                {/* Evidence snippet */}
                <div className="border border-border-subtle rounded bg-bg-deep p-2 text-[11px] space-y-1">
                  <div className="flex items-center justify-between text-zinc-400 text-[10px]">
                    <span>Observed Output (VendorB):</span>
                    <span className="text-rose-400 font-bold">$54,000 USD</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-400 text-[10px]">
                    <span>Expected Output:</span>
                    <span className="text-emerald-400 font-bold">$360 USD (54000 JPY / 150)</span>
                  </div>
                </div>

                {/* Causal flow */}
                <div className="text-[10px] text-zinc-400 flex items-center gap-1.5 truncate">
                  <span className="text-rose-400 font-bold">step_03</span>
                  <span>→</span>
                  <span className="text-amber-300">normalized_quotes</span>
                  <span>→</span>
                  <span className="text-zinc-300">step_05 selector</span>
                  <span>→</span>
                  <span className="text-rose-400">suboptimal choice</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
