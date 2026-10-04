import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { PageTransition } from './PageTransition';

export const Layout: React.FC = () => {
  const location = useLocation();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg-deep text-zinc-200">
      {/* Sidebar — static, never transitions */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header — static, never transitions */}
        <Header />

        {/* Inner page content transitions on route change */}
        <main className="flex-1 overflow-y-auto bg-bg-deep">
          <AnimatePresence mode="wait" initial={false}>
            <PageTransition key={location.pathname} style={{ minHeight: '100%' }}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};
