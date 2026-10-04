import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { useNavTransition } from '../../../app/useNavTransition';

export const FinalCTA: React.FC = () => {
  const { navigateTo } = useNavTransition();

  return (
    <section className="py-24 border-t border-border-subtle">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.25 }}
        >
          <h2 className="text-3xl sm:text-4xl font-semibold text-text-primary mb-4 tracking-tight">
            Stop guessing where the agent failed.
          </h2>
          <p className="text-base text-text-secondary mb-10 max-w-xl mx-auto leading-relaxed">
            Explore the trace. Follow the evidence. Replay the result.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={(e) => navigateTo('/explorer', e)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-text-primary text-bg-deep text-sm font-medium rounded-md hover:bg-text-secondary transition-colors duration-150 cursor-pointer border-0"
            >
              Open Explorer
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => navigateTo('/eval', e)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-transparent border border-border-medium text-text-secondary text-sm font-medium rounded-md hover:border-border-focused hover:text-text-primary transition-colors duration-150 cursor-pointer"
            >
              View Evaluation
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
