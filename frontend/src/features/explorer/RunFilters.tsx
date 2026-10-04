import React from 'react';
import { Search, Filter, X, Eye } from 'lucide-react';
import { RunFilterParams } from '../../api/types';

interface RunFiltersProps {
  filters: RunFilterParams;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onChange: (filters: RunFilterParams) => void;
  templates: string[];
  faultTypes: string[];
  agentKinds: string[];
}

export const RunFilters: React.FC<RunFiltersProps> = ({
  filters,
  searchTerm,
  onSearchChange,
  onChange,
  templates,
  faultTypes,
  agentKinds,
}) => {
  const hasActiveFilters =
    Boolean(filters.status) ||
    Boolean(filters.template) ||
    Boolean(filters.fault_type) ||
    Boolean(filters.agent_kind) ||
    searchTerm.length > 0;

  const resetFilters = () => {
    onSearchChange('');
    onChange({
      status: undefined,
      template: undefined,
      fault_type: undefined,
      agent_kind: undefined,
      reveal: filters.reveal,
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 p-2.5 bg-bg-base border border-border-subtle rounded-lg">
      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
        {/* Search Input */}
        <div className="relative w-48 sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search runs, templates, outcomes..."
            className="w-full bg-bg-surface border border-border-subtle rounded px-2 py-1 pl-8 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-border-focused transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <select
          value={filters.status || ''}
          onChange={(e) => onChange({ ...filters, status: e.target.value || undefined })}
          className="bg-bg-surface border border-border-subtle rounded px-2 py-1 text-xs text-zinc-300 font-mono focus:outline-none focus:border-border-focused hover:bg-bg-elevated transition-colors cursor-pointer"
        >
          <option value="">Status: All</option>
          <option value="FAILED">FAILED</option>
          <option value="PASSED">PASSED</option>
        </select>

        {/* Template Filter */}
        <select
          value={filters.template || ''}
          onChange={(e) => onChange({ ...filters, template: e.target.value || undefined })}
          className="bg-bg-surface border border-border-subtle rounded px-2 py-1 text-xs text-zinc-300 font-mono focus:outline-none focus:border-border-focused hover:bg-bg-elevated transition-colors cursor-pointer"
        >
          <option value="">Template: All</option>
          {templates.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        {/* Fault Type Filter */}
        <select
          value={filters.fault_type || ''}
          onChange={(e) => onChange({ ...filters, fault_type: e.target.value || undefined })}
          className="bg-bg-surface border border-border-subtle rounded px-2 py-1 text-xs text-zinc-300 font-mono focus:outline-none focus:border-border-focused hover:bg-bg-elevated transition-colors cursor-pointer"
        >
          <option value="">Fault Type: All</option>
          {faultTypes.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>

        {/* Agent Kind Filter */}
        <select
          value={filters.agent_kind || ''}
          onChange={(e) => onChange({ ...filters, agent_kind: e.target.value || undefined })}
          className="bg-bg-surface border border-border-subtle rounded px-2 py-1 text-xs text-zinc-300 font-mono focus:outline-none focus:border-border-focused hover:bg-bg-elevated transition-colors cursor-pointer"
        >
          <option value="">Agent: All</option>
          {agentKinds.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-zinc-200 px-2 py-1 rounded bg-bg-highlight border border-border-subtle transition-colors cursor-pointer"
          >
            <X className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Reveal Ground Truth Toggle */}
      <label className="flex items-center gap-2 text-xs font-mono text-zinc-400 cursor-pointer select-none px-2 py-1 bg-bg-surface rounded border border-border-subtle hover:bg-bg-elevated transition-colors shrink-0">
        <input
          type="checkbox"
          checked={Boolean(filters.reveal)}
          onChange={(e) => onChange({ ...filters, reveal: e.target.checked })}
          className="rounded border-zinc-700 bg-zinc-900 text-blue-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
        />
        <span className="flex items-center gap-1">
          <Eye className="w-3 h-3 text-zinc-500" />
          <span>Reveal Faults</span>
        </span>
      </label>
    </div>
  );
};
