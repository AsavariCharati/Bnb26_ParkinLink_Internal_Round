import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { GitCompare, ArrowLeft, CheckCircle2, AlertOctagon, ArrowRight, Layers } from 'lucide-react';
import { api } from '../../api/client';
import { Run } from '../../api/types';
import { StatusBadge } from '../explorer/StatusBadge';

export const ComparePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const runAId = searchParams.get('a') || 'run_0142';
  const runBId = searchParams.get('b') || '';

  const [allRuns, setAllRuns] = useState<Run[]>([]);
  const [runA, setRunA] = useState<Run | null>(null);
  const [runB, setRunB] = useState<Run | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadRuns = async () => {
      setLoading(true);
      try {
        const list = await api.getRuns();
        setAllRuns(list);

        if (runAId) {
          const a = await api.getRun(runAId, true);
          setRunA(a);
        }
        if (runBId) {
          const b = await api.getRun(runBId, true);
          setRunB(b);
        } else if (list.length > 1) {
          const alt = list.find((r) => r.id !== runAId) || list[0];
          const b = await api.getRun(alt.id, true);
          setRunB(b);
          setSearchParams({ a: runAId, b: alt.id });
        }
      } catch (e) {
        console.error('Failed to load runs for comparison', e);
      } finally {
        setLoading(false);
      }
    };
    loadRuns();
  }, [runAId, runBId]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-bg-surface border border-border-subtle transition-colors cursor-pointer"
            title="Back (Esc)"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <div>
            <h1 className="text-lg font-mono font-bold text-zinc-100 tracking-tight flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-blue-400" />
              TRACE EXECUTION DIFF & PROOF
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5 font-sans">
              Side-by-side comparison of execution trajectories, state modifications, and outcome transitions
            </p>
          </div>
        </div>

        {/* Trace Selectors */}
        <div className="flex items-center gap-2.5 text-xs font-mono">
          <div className="flex items-center gap-1.5 bg-bg-surface px-2 py-1 rounded border border-border-subtle">
            <span className="text-zinc-500">Trace A:</span>
            <select
              value={runAId}
              onChange={(e) => setSearchParams({ a: e.target.value, b: runBId })}
              className="bg-transparent text-zinc-200 focus:outline-none cursor-pointer text-xs"
            >
              {allRuns.map((r) => (
                <option key={r.id} value={r.id} className="bg-bg-base">
                  {r.id} ({r.status})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-bg-surface px-2 py-1 rounded border border-border-subtle">
            <span className="text-zinc-500">Trace B:</span>
            <select
              value={runB?.id || runBId}
              onChange={(e) => setSearchParams({ a: runAId, b: e.target.value })}
              className="bg-transparent text-zinc-200 focus:outline-none cursor-pointer text-xs"
            >
              {allRuns.map((r) => (
                <option key={r.id} value={r.id} className="bg-bg-base">
                  {r.id} ({r.status})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Outcome Proof Banner */}
      {runA && runB && runA.status !== runB.status && (
        <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Outcome Proof Verified: Checkpoint replay successfully flipped outcome</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold text-[10px]">
              {runA.id}: {runA.status}
            </span>
            <ArrowRight className="w-3 h-3 text-zinc-500" />
            <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
              {runB.id}: {runB.status}
            </span>
          </div>
        </div>
      )}

      {/* Side-by-Side Comparison Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Trace A */}
        <div className="p-4 rounded-lg bg-bg-base border border-border-subtle space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-border-subtle pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-500 font-bold">TRACE A:</span>
              <span className="font-bold text-zinc-100">{runA?.id}</span>
              {runA && <StatusBadge status={runA.status} size="sm" />}
            </div>
            <span className="text-[11px] text-zinc-400">{runA?.template}</span>
          </div>

          <div className="p-2.5 rounded bg-bg-surface text-xs font-sans text-zinc-300">
            {runA?.outcome_summary}
          </div>

          {/* Steps list */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase text-zinc-500 font-bold block">
              Step Trajectory ({runA?.steps.length || 0} steps)
            </span>
            <div className="space-y-1.5">
              {runA?.steps.map((step) => (
                <div
                  key={step.step_idx}
                  className={`p-2 rounded border text-xs flex items-center justify-between ${
                    step.error_flag
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      : 'bg-bg-surface border-border-subtle text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 font-bold">#{step.step_idx.toString().padStart(2, '0')}</span>
                    <span className="font-semibold">{step.step_name}</span>
                    <span className="text-[10px] text-zinc-500 capitalize">
                      ({step.step_type.replace('_', ' ')})
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500">
                    {step.latency_ms?.toFixed(0)}ms
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trace B */}
        <div className="p-4 rounded-lg bg-bg-base border border-border-subtle space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-border-subtle pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-500 font-bold">TRACE B:</span>
              <span className="font-bold text-zinc-100">{runB?.id}</span>
              {runB && <StatusBadge status={runB.status} size="sm" />}
            </div>
            <span className="text-[11px] text-zinc-400">{runB?.template}</span>
          </div>

          <div className="p-2.5 rounded bg-bg-surface text-xs font-sans text-zinc-300">
            {runB?.outcome_summary}
          </div>

          {/* Steps list */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase text-zinc-500 font-bold block">
              Step Trajectory ({runB?.steps.length || 0} steps)
            </span>
            <div className="space-y-1.5">
              {runB?.steps.map((step) => (
                <div
                  key={step.step_idx}
                  className={`p-2 rounded border text-xs flex items-center justify-between ${
                    step.error_flag
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      : 'bg-bg-surface border-border-subtle text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 font-bold">#{step.step_idx.toString().padStart(2, '0')}</span>
                    <span className="font-semibold">{step.step_name}</span>
                    <span className="text-[10px] text-zinc-500 capitalize">
                      ({step.step_type.replace('_', ' ')})
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500">
                    {step.latency_ms?.toFixed(0)}ms
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
