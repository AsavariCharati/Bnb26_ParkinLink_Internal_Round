/**
 * useNavTransition
 *
 * A tiny hook that:
 *  1. Fires a brief navigation signal event (for NavSignal to pick up)
 *  2. Returns a navigateTo(path) helper that triggers the signal then navigates
 *
 * For anchor links (#hash) that stay on the landing page:
 *  - use smoothScrollTo(id) — no signal, no route change
 *
 * Usage:
 *   const { navigateTo, smoothScrollTo } = useNavTransition();
 *   <button onClick={() => navigateTo('/explorer')}>Open Explorer</button>
 *   <a onClick={(e) => { e.preventDefault(); smoothScrollTo('how-it-works'); }}>How It Works</a>
 */

import { useNavigate } from 'react-router-dom';
import { NAV_SIGNAL_EVENT } from './NavSignal';

export function useNavTransition() {
  const navigate = useNavigate();

  /**
   * Fire the nav signal then navigate after a short delay so the
   * signal is visible for one frame before React re-renders.
   */
  const navigateTo = (path: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    // Dispatch the signal event so NavSignal shows the indicator
    window.dispatchEvent(new CustomEvent(NAV_SIGNAL_EVENT, { detail: { path } }));
    // Navigate immediately — the signal and page-enter animation handle the feel
    navigate(path);
  };

  /**
   * Smooth-scroll to a section by ID.
   * Does NOT trigger a route change or nav signal.
   */
  const smoothScrollTo = (id: string, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return { navigateTo, smoothScrollTo };
}
