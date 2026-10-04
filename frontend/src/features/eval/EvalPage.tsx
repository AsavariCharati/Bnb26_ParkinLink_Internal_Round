import React, { useEffect, useState } from 'react';
import { AlertCircle, RefreshCw, BarChart3, Database } from 'lucide-react';
import { api } from '../../api/client';
import { EvalResults } from '../../api/types';
import { OverallChart } from './OverallChart';
import { UnseenSplitChart } from './UnseenSplitChart';
import { FaultTable } from './FaultTable';
import { FeatureImportance } from './FeatureImportance';
import { TestingMethodCard } from './TestingMethodCard';

export const EvalPage: React.FC = () => {
  const [evalData, setEvalData] = useState<EvalResults | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvalData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getEvalResults();
      setEvalData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load evaluation metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvalData();
  }, []);

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-zinc-500 gap-3">
        <div className="w-5 h-5 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono">Loading diagnostic benchmarks...</span>
      </div>
    );
  }

  if (error || !evalData) {
    return (
      <div className="p-12 max-w-lg mx-auto text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
        <h2 className="text-sm font-mono font-bold text-zinc-100 uppercase">
          Failed to Load Evaluation Report
        </h2>
        <p className="text-xs text-zinc-400 font-sans">{error || 'Could not fetch evaluation dataset.'}</p>
        <button
          onClick={fetchEvalData}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-500 text-xs font-mono mx-auto cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-mono font-bold text-zinc-100 tracking-tight">
              DIAGNOSTIC MODEL EVALUATION
            </h1>

            {/* Tasteful EXAMPLE DATA Stamp */}
            {evalData.is_example && (
              <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                EXAMPLE DATA
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-0.5 font-sans">
            Attribution accuracy vs baselines, unseen fault generalization, and Gini feature importances
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="px-2.5 py-1 rounded bg-bg-surface border border-border-subtle text-zinc-400 text-[11px]">
            Validation Partition: <strong className="text-zinc-200">GroupKFold (4-Fold)</strong>
          </div>
        </div>
      </div>

      {/* Top Split: Overall Baselines & Unseen Splits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <OverallChart metrics={evalData.overall_metrics} />
        <UnseenSplitChart
          seenVsUnseen={evalData.seen_vs_unseen}
          leaveOneOut={evalData.leave_one_template_out}
        />
      </div>

      {/* Middle Split: Fault Table & Feature Importance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <FaultTable faultMetrics={evalData.per_fault_type} />
        <FeatureImportance features={evalData.feature_importance} />
      </div>

      {/* Bottom: Methodology Disclosure */}
      <TestingMethodCard methodology={evalData.methodology} />
    </div>
  );
};
