import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ListFilter,
  BarChart3,
  GitCompare,
  Terminal,
  Activity,
  Command,
} from 'lucide-react';
import { getDataMode, setDataMode, DataMode } from '../api/client';

export const Sidebar: React.FC = () => {
  const [mode, setMode] = React.useState<DataMode>(getDataMode());

  const handleModeChange = (newMode: DataMode) => {
    setMode(newMode);
    setDataMode(newMode);
  };

  const navSections = [
    {
      title: 'EXPLORE',
      items: [
        { to: '/explorer', label: 'Runs', icon: ListFilter, shortcut: '1' },
        { to: '/eval', label: 'Evaluation', icon: BarChart3, shortcut: '2' },
      ],
    },
    {
      title: 'TOOLS',
      items: [
        { to: '/compare', label: 'Compare Traces', icon: GitCompare, shortcut: '3' },
      ],
    },
  ];

  return (
    <aside className="w-60 bg-bg-base border-r border-border-subtle flex flex-col h-screen select-none shrink-0">
      {/* Brand Header */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-border-subtle bg-bg-base">
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded bg-zinc-800 border border-border-medium flex items-center justify-center text-zinc-100 font-mono text-[11px] font-bold shadow-inner">
            ■
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold tracking-tight text-zinc-100 font-mono">
              BLACK BOX
            </span>
            <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-zinc-800/80 text-zinc-400 border border-border-subtle">
              v1.0
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 py-3 px-2 space-y-4 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="px-2.5 pb-1 text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
              {section.title}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `group flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-mono transition-all duration-120 ${
                      isActive
                        ? 'bg-bg-elevated text-zinc-100 font-medium border border-border-medium shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-bg-surface border border-transparent'
                    }`
                  }
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
                    <span>{item.label}</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 group-hover:text-zinc-400">
                    {item.shortcut}
                  </span>
                </NavLink>
              );
            })}
          </div>
        ))}

        {/* Data Mode Environment Section */}
        <div className="pt-2 space-y-1">
          <div className="px-2.5 pb-1 text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
            ENVIRONMENT
          </div>
          <div className="p-2.5 rounded-md bg-bg-surface border border-border-subtle space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span className="flex items-center gap-1.5 text-zinc-400">
                <Activity className="w-3 h-3 text-zinc-400" />
                Mode
              </span>
              <span
                className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded font-semibold ${
                  mode === 'live'
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                    : mode === 'demo'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                }`}
              >
                {mode}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1 pt-0.5">
              {(['live', 'demo', 'mock'] as DataMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => handleModeChange(m)}
                  className={`text-[10px] py-1 rounded transition-all font-mono uppercase text-center cursor-pointer ${
                    mode === m
                      ? 'bg-bg-elevated text-zinc-100 border border-border-focused font-semibold shadow-inner'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-bg-highlight border border-transparent'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Meta & Keyboard Hint */}
      <div className="p-3 border-t border-border-subtle bg-bg-surface/40 text-[11px] font-mono text-zinc-400 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-zinc-400">
            <Terminal className="w-3 h-3 text-zinc-400" />
            <span>Core Engine</span>
          </span>
          <span className="text-[10px] text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            Active
          </span>
        </div>
        <div className="text-[10px] text-zinc-400 flex items-center justify-between pt-0.5 border-t border-border-subtle">
          <span>Person C: Explore</span>
          <span className="text-zinc-400">Linear/Sentry</span>
        </div>
      </div>
    </aside>
  );
};
