import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: 'What is Black Box?',
    a: 'Black Box is a developer tool for diagnosing failures inside AI agent execution traces. It records every execution step, identifies a suspicious step using a trained model, shows evidence for the diagnosis, exposes the causal chain, allows replay from a checkpoint, and proves whether a fix changes the outcome.',
  },
  {
    q: 'What does a trace contain?',
    a: 'A trace is a sequence of steps, each representing a distinct operation in the agent\'s execution: model calls, tool invocations, retrieval lookups, parsing operations, and state transitions. Each step records its input, output, latency, token usage, and any error flag.',
  },
  {
    q: 'How does diagnosis work?',
    a: 'The diagnosis model assigns a blame score to every step in the trace based on learned patterns across known failure modes. The step with the highest blame score becomes the suspect. If a trained model is unavailable, a deterministic fallback heuristic selects the first step with an error flag, or otherwise the step with the largest output change.',
  },
  {
    q: 'What is a causal chain?',
    a: 'The causal chain is the path from the suspect step to the final answer, following data dependencies: if a downstream step reads from the output or state written by the suspect (or its descendants), it is included. The chain shows how an early failure propagates through the rest of the execution.',
  },
  {
    q: 'How does replay prove a diagnosis?',
    a: 'Person B\'s replay engine re-runs the trace from a checkpoint, using the original state up to the suspect step, but with the corrected or patched version of that step\'s output. If the final answer changes, the diagnosis is confirmed: the suspect step was causally responsible for the failure.',
  },
  {
    q: 'What does the evaluation dashboard measure?',
    a: 'The evaluation dashboard measures the accuracy of the diagnosis model on a held-out set of traces with known ground-truth fault steps. Metrics include Top-1 accuracy (exact blame attribution), Top-3 accuracy (suspect in top 3 steps), and F1 score. Results are compared against majority-class and random baselines.',
  },
  {
    q: 'Do I need a running AI agent to use Black Box?',
    a: 'No. Black Box works against recorded execution traces stored as JSONL. You can load and inspect existing traces, run diagnoses, and replay outcomes without a live agent. The Explorer is available in demo mode with pre-seeded example traces.',
  },
];

export const FAQ: React.FC = () => {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 border-t border-border-subtle">
      <div className="max-w-3xl mx-auto px-6">
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-text-primary mb-3">
            Frequently asked questions.
          </h2>
          <p className="text-sm text-text-secondary">
            How Black Box works and what it measures.
          </p>
        </div>

        <div className="space-y-px">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="border border-border-subtle rounded-lg overflow-hidden mb-1"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-bg-surface transition-colors duration-100"
              >
                <span className="text-sm font-medium text-text-primary">
                  {faq.q}
                </span>
                <motion.div
                  animate={{ rotate: open === i ? 180 : 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex-shrink-0"
                >
                  <ChevronDown className="w-4 h-4 text-text-muted" />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    key="answer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-4 border-t border-border-subtle">
                      <p className="text-sm text-text-muted leading-relaxed pt-3">
                        {faq.a}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
