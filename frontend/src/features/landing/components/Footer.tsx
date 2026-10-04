import React from 'react';
import { useNavTransition } from '../../../app/useNavTransition';

const navLinks = [
  { label: 'Explorer', to: '/explorer' },
  { label: 'Evaluation', to: '/eval' },
  { label: 'Compare', to: '/compare' },
];

export const Footer: React.FC = () => {
  const { navigateTo } = useNavTransition();

  return (
    <footer className="border-t border-border-subtle py-10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          {/* Brand */}
          <div>
            <span className="font-mono text-sm font-semibold text-text-primary tracking-widest uppercase">
              BLACK BOX
            </span>
            <p className="text-[11px] text-text-muted mt-1">
              AI Agent Observability
            </p>
          </div>

          {/* Nav links — all route-changing, use navigateTo */}
          <nav className="flex items-center gap-5">
            {navLinks.map((link) => (
              <button
                key={link.to}
                onClick={(e) => navigateTo(link.to, e)}
                className="text-xs text-text-muted hover:text-text-secondary transition-colors duration-100 cursor-pointer bg-transparent border-0 p-0 font-inherit"
              >
                {link.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-6 border-t border-border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <p className="text-[11px] text-text-muted font-mono">
            A hackathon project · Black Box Team
          </p>
          <p className="text-[11px] text-text-muted">
            Trace → Diagnose → Replay
          </p>
        </div>
      </div>
    </footer>
  );
};
