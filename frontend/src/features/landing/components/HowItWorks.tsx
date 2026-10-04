import React from 'react';
import { Camera, Search, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Capture',
      subtitle: 'Preserve complete execution trace',
      description:
        'Records all intermediate LLM prompts, parser outputs, tool payloads, latencies, token counts, and state dictionary mutations.',
      icon: Camera,
    },
    {
      num: '02',
      title: 'Inspect',
      subtitle: 'Explore step trajectory & telemetry',
      description:
        'Navigate the horizontal trace timeline to inspect raw payloads, environment state deltas, and reads/writes variable dependencies.',
      icon: Search,
    },
    {
      num: '03',
      title: 'Diagnose',
      subtitle: 'Attribution & evidence scoring',
      description:
        'Isolates the root suspect step using relative blame scoring, comparing observed mutations against healthy reference baselines.',
      icon: Sparkles,
    },
    {
      num: '04',
      title: 'Prove',
      subtitle: 'Replay checkpoint & verify fix',
      description:
        'Fork execution from the suspect step, apply a remediation patch, and prove whether the downstream failure flips to PASSED.',
      icon: CheckCircle2,
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-bg-base border-b border-border-subtle">
      <div className="max-w-6xl mx-auto px-6 space-y-14">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-semibold">
            THE OBSERVABILITY LIFECYCLE
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-zinc-100 font-sans">
            How Black Box works.
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-sans">
            A deterministic 4-stage loop designed for debugging and validating autonomous agent systems.
          </p>
        </div>

        {/* 4 Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={s.num}
                className="p-5 rounded-xl bg-bg-surface/60 border border-border-subtle flex flex-col justify-between space-y-4 hover:border-border-medium transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-lg font-bold text-zinc-600">#{s.num}</span>
                    <div className="w-6 h-6 rounded bg-bg-elevated border border-border-subtle flex items-center justify-center text-blue-400">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-zinc-100 font-mono">{s.title}</h3>
                  <div className="text-[11px] font-semibold text-zinc-400 font-sans">{s.subtitle}</div>
                </div>

                <p className="text-xs text-zinc-400 font-sans leading-relaxed pt-2 border-t border-border-subtle">
                  {s.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
