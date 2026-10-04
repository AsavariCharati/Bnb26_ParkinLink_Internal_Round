import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, FlaskConical } from 'lucide-react';
import { useNavTransition } from '../../../app/useNavTransition';

const metrics = [
  { label: 'Top-1 Accuracy', value: '71%', sub: 'Exact blame attribution' },
  { label: 'Top-3 Accuracy', value: '89%', sub: 'Suspect in top 3 steps' },
  { label: 'F1 Score', value: '0.74', sub: 'Weighted across fault types' },
  { label: 'vs. Majority Baseline', value: '+38%', sub: 'Absolute improvement' },
];

const comparisons = [
  { label: 'Black Box Model', top1: 71, top3: 89, color: 'bg-accent-DEFAULT' },
  { label: 'Majority Baseline', top1: 33, top3: 58, color: 'bg-bg-highlight' },
  { label: 'Random Baseline', top1: 18, top3: 42, color: 'bg-bg-highlight' },
];

export const EvaluationSection: React.FC = () => {
  const { navigateTo } = useNavTransition();

  return (
    <section className="py-24 border-t border-border-subtle">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header row: title block left, CTA link right — aligned to top of title */}
        <div className="flex items-start justify-between mb-12">
          <div className="flex-1 min-w-0 mr-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium tracking-widest text-amber-400 border border-amber-400/30 bg-amber-400/5 uppercase">
                EXAMPLE DATA
              </span>
            </div>
            <h2 className="text-2xl font-semibold text-text-primary mb-3">
              Measurable diagnosis accuracy.
            </h2>
            <p className="text-sm text-text-secondary max-w-lg">
              Black Box's trained model is evaluated against held-out traces and
              compared against naive baselines. Every metric is computed on unseen data.
            </p>
          </div>

          {/* Desktop CTA — flex-shrink-0 keeps it from collapsing; self-start pins to top */}
          <button
            onClick={(e) => navigateTo('/eval', e)}
            className="hidden md:inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors flex-shrink-0 self-start mt-0 cursor-pointer bg-transparent border-0 p-0"
          >
            View full evaluation
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.2, delay: i * 0.05 }}
              className="bg-bg-surface border border-border-subtle rounded-lg p-4"
            >
              <p className="text-[11px] text-text-muted font-mono uppercase tracking-wider mb-2">
                {m.label}
              </p>
              <p className="text-2xl font-semibold font-mono text-text-primary">
                {m.value}
              </p>
              <p className="text-[11px] text-text-muted mt-1">{m.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Bar comparison */}
        <div className="bg-bg-surface border border-border-subtle rounded-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <FlaskConical className="w-4 h-4 text-text-muted" />
            <span className="text-xs font-mono text-text-muted uppercase tracking-widest">
              Model vs Baselines — Top-1 Accuracy
            </span>
          </div>

          <div className="space-y-4">
            {comparisons.map((c, i) => (
              <motion.div
                key={c.label}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.07 }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-text-secondary">{c.label}</span>
                  <span className="text-xs font-mono text-text-primary">
                    {c.top1}%
                  </span>
                </div>
                <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${c.color}`}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${c.top1}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.07 + 0.1, ease: 'easeOut' }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mobile CTA */}
        <div className="mt-6 md:hidden">
          <button
            onClick={(e) => navigateTo('/eval', e)}
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors cursor-pointer bg-transparent border-0 p-0"
          >
            View full evaluation
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
};
