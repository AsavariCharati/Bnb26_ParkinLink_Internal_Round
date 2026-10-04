import React from 'react';
import { motion } from 'motion/react';
import { Bot, BrainCircuit, FlaskConical, Server, Wrench } from 'lucide-react';

const audiences = [
  {
    icon: Bot,
    title: 'AI engineers',
    body: 'Building and maintaining multi-step agent pipelines that need to be debuggable in production.',
  },
  {
    icon: BrainCircuit,
    title: 'ML researchers',
    body: 'Running controlled experiments on agent behavior and needing reproducible, replayable traces.',
  },
  {
    icon: FlaskConical,
    title: 'Agent developers',
    body: 'Writing custom tool-use loops, retrieval chains, or orchestration layers where failures are hard to trace.',
  },
  {
    icon: Server,
    title: 'Platform teams',
    body: 'Operating AI infrastructure and needing structured observability over execution quality at scale.',
  },
  {
    icon: Wrench,
    title: 'Debugging workflows',
    body: 'Any team spending time manually diffing logs to understand why an agent produced the wrong answer.',
  },
];

export const DesignedFor: React.FC = () => {
  return (
    <section className="py-24 border-t border-border-subtle">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-text-primary mb-3">
            Designed for the people building agents.
          </h2>
          <p className="text-sm text-text-secondary max-w-lg">
            Black Box is built for developers who need to understand execution,
            not just read output.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {audiences.map((a, i) => {
            const Icon = a.icon;
            return (
              <motion.div
                key={a.title}
                initial={{ opacity: 0, y: 6 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.18, delay: i * 0.05 }}
                className="bg-bg-surface border border-border-subtle rounded-lg p-5 hover:border-border-medium transition-colors duration-150"
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <Icon className="w-4 h-4 text-text-secondary flex-shrink-0" />
                  <h3 className="text-sm font-medium text-text-primary">
                    {a.title}
                  </h3>
                </div>
                <p className="text-sm text-text-muted leading-relaxed">{a.body}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
