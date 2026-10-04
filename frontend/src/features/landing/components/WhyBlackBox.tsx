import React from 'react';
import { motion } from 'motion/react';
import { Cpu, FileSearch, GitFork, RotateCcw } from 'lucide-react';

const principles = [
  {
    icon: Cpu,
    title: 'Execution-aware',
    body: 'Black Box understands the structure of agent execution — model calls, tool invocations, retrieval, state changes — not just logs.',
  },
  {
    icon: FileSearch,
    title: 'Evidence-backed',
    body: 'Every diagnosis is accompanied by a structured evidence table: observed output, expected output, and the delta that caused the failure.',
  },
  {
    icon: GitFork,
    title: 'Causality-aware',
    body: 'The causal chain traces how a fault in one step propagates through downstream steps via data dependencies.',
  },
  {
    icon: RotateCcw,
    title: 'Replayable',
    body: 'Fixes can be replayed from a checkpoint. The outcome proof shows whether your fix actually changed the result.',
  },
];

export const WhyBlackBox: React.FC = () => {
  return (
    <section className="py-24 border-t border-border-subtle">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-text-primary mb-3">
            Debugging built around evidence.
          </h2>
          <p className="text-sm text-text-secondary max-w-lg">
            Traditional logging tells you what happened. Black Box tells you
            why — and proves whether a fix works.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {principles.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.2, delay: i * 0.06 }}
                className="flex gap-4 bg-bg-surface border border-border-subtle rounded-lg p-5 hover:border-border-medium transition-colors duration-150"
              >
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-8 h-8 rounded-md bg-bg-elevated flex items-center justify-center">
                    <Icon className="w-4 h-4 text-text-secondary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-text-primary mb-1.5">
                    {p.title}
                  </h3>
                  <p className="text-sm text-text-muted leading-relaxed">{p.body}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
