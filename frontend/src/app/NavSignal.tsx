/**
 * NavSignal
 *
 * A tiny animated navigation indicator dot that briefly appears when the user
 * triggers a route-changing navigation. It fades in, pulses once, then fades out.
 *
 * Visual identity: small electric-blue point with subtle glow.
 * Duration: ~300ms — barely perceptible, never distracting.
 *
 * Rendered once at the root of the app (inside BrowserRouter).
 * Listens for NAV_SIGNAL_EVENT dispatched by useNavTransition.
 *
 * prefers-reduced-motion: renders nothing, just passes through.
 */

import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';

export const NAV_SIGNAL_EVENT = 'bb:nav-signal';

interface SignalState {
  id: number;
}

// Check reduced motion once (does not change during session)
const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const NavSignal: React.FC = () => {
  const [signal, setSignal] = useState<SignalState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const counterRef = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const handler = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      counterRef.current += 1;
      setSignal({ id: counterRef.current });
      // Auto-dismiss after the animation completes
      timerRef.current = setTimeout(() => {
        setSignal(null);
      }, 500);
    };

    window.addEventListener(NAV_SIGNAL_EVENT, handler);
    return () => {
      window.removeEventListener(NAV_SIGNAL_EVENT, handler);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (prefersReducedMotion) return null;

  return (
    // Fixed bottom-right — out of the way of content and cursor
    <div
      className="fixed bottom-6 right-6 z-[9999] pointer-events-none select-none"
      aria-hidden="true"
    >
      <AnimatePresence>
        {signal && (
          <motion.div
            key={signal.id}
            initial={{ opacity: 0, scale: 0.4, x: -6 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.6, x: 8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="flex items-center gap-1"
          >
            {/* Trailing line */}
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 16, opacity: 0.40 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="h-px bg-blue-400"
            />
            {/* Signal dot */}
            <motion.div
              animate={{ opacity: [1, 0.6, 1] }}
              transition={{ duration: 0.3, repeat: 1, ease: 'easeInOut' }}
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: '#4A8CF7',
                boxShadow: '0 0 8px 2px rgba(74,140,247,0.7)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
