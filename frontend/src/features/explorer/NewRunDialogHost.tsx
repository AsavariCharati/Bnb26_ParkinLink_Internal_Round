import React, { useState } from 'react';
import { Plus, X, Play, Loader2 } from 'lucide-react';
import { api } from '../../api/client';
import { Run } from '../../api/types';

interface NewRunDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (runId: string) => void;
}

export const NewRunDialogHost: React.FC<NewRunDialogProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [template, setTemplate] = useState('price_compare');
  const [agentKind, setAgentKind] = useState<'simulated' | 'openai' | 'anthropic'>('simulated');
  const [injectFault, setInjectFault] = useState(true);
  const [faultType, setFaultType] = useState('numeric_overflow');
  const [isExecuting, setIsExecuting] = useState(false);

  if (!isOpen) return null;

  const handleStartRun = async () => {
    setIsExecuting(true);
    const newId = `run_${Math.floor(1000 + Math.random() * 9000)}`;

    const simulatedRun: Run = {
      id: newId,
      template,
      agent_kind: agentKind,
      status: injectFault ? 'FAILED' : 'PASSED',
      outcome_summary: injectFault
        ? `Execution failed due to injected fault '${faultType}'`
        : 'Execution succeeded with expected output',
      created_at: new Date().toISOString(),
      suspect_step: injectFault ? 2 : null,
      fault: injectFault
        ? {
            fault_type: faultType,
            injected_step: 2,
            description: `Simulated fault injection: ${faultType}`,
            patch_recommendation: `Fix step 2 schema and payload validation`,
          }
        : null,
      steps: [
        {
          step_idx: 1,
          step_name: 'parse_input',
          step_type: 'plan',
          input_data: { query: `Execute ${template} workflow` },
          output_data: { parsed: true, target: template },
          state_delta: { stage: 'initialized' },
          reads: [],
          writes: ['query_params'],
          latency_ms: 65,
          tokens: 45,
          error_flag: false,
        },
        {
          step_idx: 2,
          step_name: 'core_processor',
          step_type: 'llm_call',
          raw_prompt: `Process input parameters for ${template}`,
          input_data: { target: template },
          output_data: injectFault ? { value: -1, status: 'error' } : { value: 100, status: 'ok' },
          state_delta: { processed_value: injectFault ? -1 : 100 },
          reads: ['query_params'],
          writes: ['processed_data'],
          latency_ms: 320,
          tokens: 180,
          error_flag: injectFault,
          error_message: injectFault ? `Anomaly: ${faultType}` : undefined,
        },
        {
          step_idx: 3,
          step_name: 'final_answer',
          step_type: 'final_answer',
          input_data: { processed: injectFault ? -1 : 100 },
          output_data: { outcome: injectFault ? 'FAILED' : 'SUCCESS' },
          state_delta: { completed: true },
          reads: ['processed_data'],
          writes: ['final_output'],
          latency_ms: 25,
          tokens: 30,
          error_flag: injectFault,
          error_message: injectFault ? 'Downstream failure triggered' : undefined,
        },
      ],
    };

    try {
      await api.saveRun(simulatedRun);
      setTimeout(() => {
        setIsExecuting(false);
        onClose();
        onCreated(newId);
      }, 400);
    } catch (e) {
      setIsExecuting(false);
      onClose();
      onCreated(newId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-bg-base border border-border-medium rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-zinc-100">Execute New Run</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-bg-elevated transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          <div>
            <label className="block font-mono text-zinc-400 mb-1.5 font-medium">
              Agent Template
            </label>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="w-full bg-bg-surface border border-border-subtle rounded-md px-3 py-2 text-zinc-200 font-mono focus:border-border-focused focus:outline-none"
            >
              <option value="price_compare">price_compare</option>
              <option value="policy_lookup">policy_lookup</option>
              <option value="sql_agent">sql_agent</option>
              <option value="customer_support">customer_support</option>
            </select>
          </div>

          <div>
            <label className="block font-mono text-zinc-400 mb-1.5 font-medium">
              Agent Backend
            </label>
            <div className="grid grid-cols-3 gap-2 font-mono">
              {(['simulated', 'openai', 'anthropic'] as const).map((kind) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => setAgentKind(kind)}
                  className={`py-1.5 px-2 rounded border text-center transition-all ${
                    agentKind === kind
                      ? 'bg-bg-elevated border-blue-500/50 text-blue-300 font-medium'
                      : 'bg-bg-surface border-border-subtle text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {kind}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-border-subtle">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={injectFault}
                onChange={(e) => setInjectFault(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-900 text-rose-500 focus:ring-0"
              />
              <span className="text-zinc-300 font-medium">Inject benchmark fault condition</span>
            </label>

            {injectFault && (
              <div className="mt-3">
                <label className="block font-mono text-zinc-400 mb-1">Fault Type</label>
                <select
                  value={faultType}
                  onChange={(e) => setFaultType(e.target.value)}
                  className="w-full bg-bg-surface border border-border-subtle rounded-md px-3 py-2 text-zinc-200 font-mono focus:border-border-focused focus:outline-none"
                >
                  <option value="numeric_overflow">numeric_overflow</option>
                  <option value="schema_inversion">schema_inversion</option>
                  <option value="hallucinated_id">hallucinated_id</option>
                  <option value="stale_retrieval">stale_retrieval</option>
                  <option value="prompt_injection_drift">prompt_injection_drift</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-bg-surface/50 border-t border-border-subtle flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-bg-elevated transition-colors text-xs font-mono"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleStartRun}
            disabled={isExecuting}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow transition-all disabled:opacity-50 font-mono"
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                Start Execution
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
