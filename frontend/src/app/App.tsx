import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { Layout } from './Layout';
import { PageTransition } from './PageTransition';
import { NavSignal } from './NavSignal';
import { LandingPage } from '../features/landing/LandingPage';
import { ExplorerPage } from '../features/explorer/ExplorerPage';
import { RunDetailPage } from '../features/run-detail/RunDetailPage';
import { EvalPage } from '../features/eval/EvalPage';
import { ComparePage } from '../features/compare/ComparePage';

/**
 * AnimatedRoutes
 *
 * Keyed by top-level segment so:
 *  - Landing ↔ any app route: full PageTransition (fade+slide)
 *  - Explorer ↔ Eval ↔ Compare: handled inside Layout's own AnimatePresence
 *    (sidebar stays mounted, only Outlet content transitions)
 *
 * We key by the first path segment — "/" stays "/" and all app routes
 * share a common "app" key so the Layout shell does NOT exit/re-enter
 * when navigating between /explorer and /eval.
 */
const AnimatedRoutes: React.FC = () => {
  const location = useLocation();
  // "/" = landing page key; anything else = "app" shell key
  const topLevelKey = location.pathname === '/' ? '/' : 'app';

  return (
    <AnimatePresence mode="wait" initial={false}>
      <PageTransition key={topLevelKey} style={{ height: '100%' }}>
        <Routes location={location}>
          {/* Public landing page — no Layout shell */}
          <Route path="/" element={<LandingPage />} />

          {/* App routes — inside Layout (sidebar + header stay mounted) */}
          <Route element={<Layout />}>
            <Route path="explorer" element={<ExplorerPage />} />
            <Route path="runs/:id" element={<RunDetailPage />} />
            <Route path="eval" element={<EvalPage />} />
            <Route path="compare" element={<ComparePage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PageTransition>
    </AnimatePresence>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      {/* NavSignal: tiny animated dot on route-changing clicks */}
      <NavSignal />
      <AnimatedRoutes />
    </BrowserRouter>
  );
};
