import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw, AlertCircle, CheckCircle2, Cpu, Terminal } from 'lucide-react';
import { api } from '../../api/client';
import { Run, RunFilterParams } from '../../api/types';
import { RunFilters } from './RunFilters';
import { RunTable } from './RunTable';
import { NewRunDialogHost } from './NewRunDialogHost';

export const ExplorerPage: React.FC = () => {
  const navigate = useNavigate();
  const [runs, setRuns] = useState<Run[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNewRunOpen, setIsNewRunOpen] = useState(false);

  const [filters, setFilters] = useState<RunFilterParams>({
    status: undefined,
    template: undefined,
    fault_type: undefined,
    agent_kind: undefined,
    reveal: false,
  });

  const fetchRuns = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getRuns(filters);
      setRuns(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load runs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, [filters]);

  // Client-side search filtering across query, outcome, template, id
  const filteredRuns = useMemo(() => {
    if (!searchTerm.trim()) return runs;
    const term = searchTerm.toLowerCase();
    return runs.filter(
      (r) =>
        r.id.toLowerCase().includes(term) ||
        r.template.toLowerCase().includes(term) ||
        r.outcome_summary.toLowerCase().includes(term) ||
        r.agent_kind.toLowerCase().includes(term) ||
        r.fault?.fault_type.toLowerCase().includes(term) ||
        r.steps.some((s) => s.step_name.toLowerCase().includes(term) || s.error_message?.toLowerCase().includes(term))
    );
  }, [runs, searchTerm]);

  // Unique filter options
  const templates = useMemo(() => Array.from(new Set(runs.map((r) => r.template).filter(Boolean))), [runs]);
  const faultTypes = ['numeric_overflow', 'schema_inversion', 'hallucinated_id', 'stale_retrieval', 'prompt_injection_drift'];
  const agentKinds = useMemo(() => Array.from(new Set(runs.map((r) => r.agent_kind).filter(Boolean))), [runs]);

  const stats = useMemo(() => {
    const total = runs.length;
    const failed = runs.filter((r) => r.status.toUpperCase() === 'FAILED').length;
    const passed = runs.filter((r) => r.status.toUpperCase() === 'PASSED').length;
    return { total, failed, passed };
  }, [runs]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-mono font-bold text-zinc-100 tracking-tight">
              EXECUTION TRACES
            </h1>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-bg-surface text-zinc-400 border border-border-subtle">
              {stats.total} total
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5 font-sans">
            Trace execution history, diagnostic attribution, and causal fault paths
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewRunOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold font-mono shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Run</span>
          </button>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-bg-base border border-border-subtle flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-[10px] font-mono uppercase text-zinc-400 font-semibold">Total Traces</div>
            <div className="text-lg font-mono font-bold text-zinc-100">{stats.total}</div>
          </div>
          <Cpu className="w-4 h-4 text-zinc-400" />
        </div>

        <div className="p-3 rounded-lg bg-bg-base border border-border-subtle flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-[10px] font-mono uppercase text-rose-400 font-semibold">Diagnosable Failures</div>
            <div className="text-lg font-mono font-bold text-rose-400">{stats.failed}</div>
          </div>
          <AlertCircle className="w-4 h-4 text-rose-500/50" />
        </div>

        <div className="p-3 rounded-lg bg-bg-base border border-border-subtle flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-[10px] font-mono uppercase text-emerald-400 font-semibold">Nominal Passes</div>
            <div className="text-lg font-mono font-bold text-emerald-400">{stats.passed}</div>
          </div>
          <CheckCircle2 className="w-4 h-4 text-emerald-500/50" />
        </div>
      </div>

      {/* Filter Bar */}
      <RunFilters
        filters={filters}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onChange={setFilters}
        templates={templates}
        faultTypes={faultTypes}
        agentKinds={agentKinds}
      />

      {/* Error State */}
      {error && (
        <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-xs text-rose-300 font-mono">
          <span>Error loading traces: {error}</span>
          <button
            onClick={fetchRuns}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      <RunTable runs={filteredRuns} loading={loading} reveal={Boolean(filters.reveal)} />

      {/* New Run Modal Integration */}
      <NewRunDialogHost
        isOpen={isNewRunOpen}
        onClose={() => setIsNewRunOpen(false)}
        onCreated={(runId) => {
          fetchRuns();
          navigate(`/runs/${runId}`);
        }}
      />
    </div>
  );
};
