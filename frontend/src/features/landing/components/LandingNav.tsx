import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavTransition } from '../../../app/useNavTransition';

export const LandingNav: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { navigateTo, smoothScrollTo } = useNavTransition();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        isScrolled
          ? 'bg-bg-deep/80 backdrop-blur-md border-b border-border-subtle shadow-sm py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
        {/* Brand — goes back to / (landing), no transition needed */}
        <button
          onClick={(e) => navigateTo('/', e)}
          className="flex items-center gap-2.5 group select-none cursor-pointer bg-transparent border-0 p-0"
        >
          <div className="w-5 h-5 rounded bg-zinc-800 border border-border-medium flex items-center justify-center text-zinc-100 font-mono text-[11px] font-bold shadow-inner group-hover:border-zinc-500 transition-colors">
            ■
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold tracking-tight text-zinc-100 font-mono">
              BLACK BOX
            </span>
            <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-zinc-800/80 text-zinc-400 border border-border-subtle">
              v1.0
            </span>
          </div>
        </button>

        {/* Center nav — anchor links use smoothScrollTo, route links use navigateTo */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-mono text-zinc-400">
          <button
            onClick={(e) => smoothScrollTo('how-it-works', e)}
            className="hover:text-zinc-200 transition-colors cursor-pointer bg-transparent border-0 p-0 font-mono text-xs text-zinc-400"
          >
            How It Works
          </button>
          <button
            onClick={(e) => smoothScrollTo('capabilities', e)}
            className="hover:text-zinc-200 transition-colors cursor-pointer bg-transparent border-0 p-0 font-mono text-xs text-zinc-400"
          >
            Capabilities
          </button>
          <button
            onClick={(e) => smoothScrollTo('showcase', e)}
            className="hover:text-zinc-200 transition-colors cursor-pointer bg-transparent border-0 p-0 font-mono text-xs text-zinc-400"
          >
            Interactive Trace
          </button>
          <button
            onClick={(e) => navigateTo('/eval', e)}
            className="hover:text-zinc-200 transition-colors cursor-pointer bg-transparent border-0 p-0 font-mono text-xs text-zinc-400"
          >
            Evaluation
          </button>
          <button
            onClick={(e) => smoothScrollTo('faq', e)}
            className="hover:text-zinc-200 transition-colors cursor-pointer bg-transparent border-0 p-0 font-mono text-xs text-zinc-400"
          >
            FAQ
          </button>
        </nav>

        {/* Right CTA — route-changing, uses navigateTo */}
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => navigateTo('/explorer', e)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-mono font-semibold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer border-0"
          >
            <span>Open Explorer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
