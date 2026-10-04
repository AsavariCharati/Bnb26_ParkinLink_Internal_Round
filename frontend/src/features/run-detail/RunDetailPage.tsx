import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RefreshCw, AlertTriangle, ArrowLeft, Terminal, Keyboard } from 'lucide-react';
import { api } from '../../api/client';
import { Run, Step, Diagnosis } from '../../api/types';
import { RunHeader } from './RunHeader';
import { Timeline } from './Timeline';
import { StepPanel } from './StepPanel';
import { DiagnosisCard } from './DiagnosisCard';
import { CausalChain } from './CausalChain';
import { ReplayHost } from './ReplayHost';

export const RunDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [run, setRun] = useState<Run | null>(null);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [selectedStepIdx, setSelectedStepIdx] = useState<number>(1);
  const [reveal, setReveal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDiagnosing, setIsDiagnosing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isReplayOpen, setIsReplayOpen] = useState<boolean>(false);

  const fetchRun = async (showReveal = reveal) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getRun(id, showReveal);
      setRun(data);
      if (data.steps && data.steps.length > 0) {
        setSelectedStepIdx(data.suspect_step || data.steps[0].step_idx);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load trace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRun(reveal);
  }, [id, reveal]);

  const handleDiagnose = useCallback(async () => {
    if (!id || isDiagnosing) return;
    setIsDiagnosing(true);
    try {
      const diag = await api.diagnoseRun(id);
      setDiagnosis(diag);
      if (diag.suspect_step) {
        setSelectedStepIdx(diag.suspect_step);
      }
    } catch (err: any) {
      console.error('Diagnosis failed:', err);
    } finally {
      setIsDiagnosing(false);
    }
  }, [id, isDiagnosing]);

  const handleToggleReveal = () => {
    setReveal((prev) => !prev);
  };

  // Keyboard navigation & shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (run && run.steps.length > 0) {
          setSelectedStepIdx((curr) => {
            const minIdx = run.steps[0].step_idx;
            return Math.max(minIdx, curr - 1);
          });
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (run && run.steps.length > 0) {
          setSelectedStepIdx((curr) => {
            const maxIdx = run.steps[run.steps.length - 1].step_idx;
            return Math.min(maxIdx, curr + 1);
          });
        }
      } else if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        handleDiagnose();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        setIsReplayOpen(true);
      } else if (e.key === 'Escape') {
        if (isReplayOpen) {
          setIsReplayOpen(false);
        } else {
          navigate('/explorer');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [run, handleDiagnose, isReplayOpen, navigate]);

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-zinc-500 gap-3">
        <div className="w-5 h-5 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono">Loading trace {id}...</span>
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="p-12 max-w-lg mx-auto text-center space-y-4">
        <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
        <h2 className="text-sm font-mono font-bold text-zinc-100 uppercase">Trace Not Found</h2>
        <p className="text-xs text-zinc-400">{error || `Could not find trace with identifier '${id}'`}</p>
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => navigate('/explorer')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-bg-surface text-zinc-300 hover:text-zinc-100 border border-border-subtle text-xs font-mono cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Explorer</span>
          </button>
          <button
            onClick={() => fetchRun(reveal)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-500 text-xs font-mono cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  const selectedStep = run.steps.find((s) => s.step_idx === selectedStepIdx) || run.steps[0];

  return (
    <div className="flex flex-col min-h-full pb-10">
      {/* 1. Run Header */}
      <RunHeader
        run={run}
        diagnosis={diagnosis}
        isDiagnosing={isDiagnosing}
        onDiagnose={handleDiagnose}
        onOpenReplay={() => setIsReplayOpen(true)}
        reveal={reveal}
        onToggleReveal={handleToggleReveal}
      />

      {/* 2. Execution Timeline */}
      <Timeline
        steps={run.steps}
        selectedStepIdx={selectedStepIdx}
        onSelectStep={setSelectedStepIdx}
        diagnosis={diagnosis}
      />

      {/* 3. Middle Split: Step Info + Diagnosis Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 flex-1">
        {/* Step Inspector Panel */}
        <div className={diagnosis ? 'lg:col-span-7' : 'lg:col-span-12'}>
          <StepPanel step={selectedStep} />
        </div>

        {/* Diagnosis Attribution Card */}
        {diagnosis && (
          <div className="lg:col-span-5">
            <DiagnosisCard diagnosis={diagnosis} onSelectStep={setSelectedStepIdx} />
          </div>
        )}
      </div>

      {/* 4. Causal Chain Flow */}
      {diagnosis && (
        <CausalChain
          chain={diagnosis.causal_chain}
          onSelectStep={setSelectedStepIdx}
          selectedStepIdx={selectedStepIdx}
        />
      )}

      {/* Keyboard Shortcuts Hint Bar */}
      <div className="fixed bottom-0 left-60 right-0 h-7 bg-bg-base/90 backdrop-blur-xs border-t border-border-subtle px-4 flex items-center justify-between text-[10px] font-mono text-zinc-500 z-20 select-none">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <kbd className="px-1 py-0.2 rounded bg-bg-surface border border-border-subtle text-zinc-400">←</kbd>
            <kbd className="px-1 py-0.2 rounded bg-bg-surface border border-border-subtle text-zinc-400">→</kbd>
            <span>Navigate Steps</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.2 rounded bg-bg-surface border border-border-subtle text-zinc-400">D</kbd>
            <span>Diagnose</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.2 rounded bg-bg-surface border border-border-subtle text-zinc-400">R</kbd>
            <span>Replay</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.2 rounded bg-bg-surface border border-border-subtle text-zinc-400">Esc</kbd>
            <span>Back</span>
          </span>
        </div>
        <div className="text-zinc-600 hidden sm:block">
          Black Box Debugger
        </div>
      </div>

      {/* Person B Replay Drawer Host */}
      <ReplayHost
        run={run}
        stepIdx={selectedStepIdx}
        isOpen={isReplayOpen}
        onClose={() => setIsReplayOpen(false)}
        onResult={(updatedRun) => {
          setRun(updatedRun);
          fetchRun(reveal);
        }}
      />
    </div>
  );
};
