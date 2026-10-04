import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, RefreshCw, Cpu, Layers } from 'lucide-react';

export const Header: React.FC<{ onRefresh?: () => void }> = ({ onRefresh }) => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  return (
    <header className="h-14 border-b border-border-subtle bg-bg-base/80 backdrop-blur-sm px-6 flex items-center justify-between sticky top-0 z-10">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
        <Link to="/" className="text-zinc-400 hover:text-zinc-200 transition-colors">
          root
        </Link>
        {pathSegments.length === 0 ? (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
            <span className="text-zinc-200 font-medium">runs</span>
          </>
        ) : (
          pathSegments.map((segment, idx) => {
            const path = `/${pathSegments.slice(0, idx + 1).join('/')}`;
            const isLast = idx === pathSegments.length - 1;
            return (
              <React.Fragment key={path}>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
                {isLast ? (
                  <span className="text-zinc-200 font-medium">{segment}</span>
                ) : (
                  <Link to={path} className="text-zinc-400 hover:text-zinc-200 transition-colors">
                    {segment}
                  </Link>
                )}
              </React.Fragment>
            );
          })
        )}
      </div>

      {/* Header Utilities */}
      <div className="flex items-center gap-3">
        {onRefresh && (
          <button
            onClick={onRefresh}
            title="Refresh current view"
            className="p-1.5 rounded-md hover:bg-bg-elevated text-zinc-400 hover:text-zinc-200 transition-colors border border-border-subtle"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-bg-surface border border-border-subtle text-xs font-mono text-zinc-400">
          <Cpu className="w-3.5 h-3.5 text-blue-400" />
          <span>blackbox-core</span>
        </div>
      </div>
    </header>
  );
};
