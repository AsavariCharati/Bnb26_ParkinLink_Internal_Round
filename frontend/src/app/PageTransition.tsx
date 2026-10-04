/**
 * PageTransition
 *
 * Wraps page content so every route change gets a subtle fade + slight
 * vertical slide. Keyed by location.pathname so AnimatePresence fires
 * exit/enter when the route changes.
 *
 * Variants:
 *  - Normal:         opacity + translateY (8px) over 220ms
 *  - Reduced motion: opacity only, 120ms
 *
 * Usage:
 *   Wrap the innermost page content — NOT the Layout shell.
 *   The Layout sidebar/header should NOT transition.
 *
 *   In App.tsx:
 *     <AnimatePresence mode="wait" initial={false}>
 *       <PageTransition key={location.pathname}>
 *         <Routes>...</Routes>
 *       </PageTransition>
 *     </AnimatePresence>
 */

import React from 'react';
import { motion } from 'motion/react';

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface PageTransitionProps {
  children: React.ReactNode;
  /** Optional extra className for the wrapper div */
  className?: string;
  /** Optional inline styles */
  style?: React.CSSProperties;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children, className, style }) => {
  const variants = prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit:    { opacity: 0 },
      }
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit:    { opacity: 0, y: -6 },
      };

  const transition = prefersReducedMotion
    ? { duration: 0.12 }
    : { duration: 0.22, ease: [0.25, 0.1, 0.25, 1] as const };

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={transition}
      className={className}
      style={{ willChange: 'opacity, transform', ...style }}
    >
      {children}
    </motion.div>
  );
};
