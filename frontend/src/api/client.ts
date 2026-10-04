import {
  Run,
  Diagnosis,
  EvalResults,
  DemoBundle,
  RunFilterParams,
} from './types';
import { DEMO_BUNDLE_DATA } from './demoData';

export type DataMode = 'mock' | 'demo' | 'live';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';

// Initialize data mode from env, localStorage or default to 'demo' for seamless out-of-the-box experience
let currentMode: DataMode =
  (localStorage.getItem('blackbox_data_mode') as DataMode) ||
  (import.meta.env.VITE_DATA_MODE as DataMode) ||
  'live';

// In-memory mock/demo state for when running without backend
let inMemoryRuns = [...DEMO_BUNDLE_DATA.runs];
let inMemoryDiagnoses = { ...DEMO_BUNDLE_DATA.diagnoses };

export function getDataMode(): DataMode {
  return currentMode;
}

export function setDataMode(mode: DataMode): void {
  currentMode = mode;
  localStorage.setItem('blackbox_data_mode', mode);
  window.dispatchEvent(new Event('blackbox-mode-change'));
}

export const api = {
  async getRuns(params: RunFilterParams = {}): Promise<Run[]> {
    if (currentMode === 'demo' || currentMode === 'mock') {
      let filtered = inMemoryRuns.filter((r) => {
        if (params.status && r.status.toUpperCase() !== params.status.toUpperCase()) return false;
        if (params.template && r.template.toLowerCase() !== params.template.toLowerCase()) return false;
        if (params.agent_kind && r.agent_kind.toLowerCase() !== params.agent_kind.toLowerCase()) return false;
        if (params.fault_type && r.fault?.fault_type.toLowerCase() !== params.fault_type.toLowerCase()) return false;
        return true;
      });

      // Mask fault if reveal is not true
      return filtered.map((r) => {
        if (!params.reveal) {
          return { ...r, fault: null };
        }
        return r;
      });
    }

    try {
      const searchParams = new URLSearchParams();
      if (params.status) searchParams.append('status', params.status);
      if (params.fault_type) searchParams.append('fault_type', params.fault_type);
      if (params.template) searchParams.append('template', params.template);
      if (params.agent_kind) searchParams.append('agent_kind', params.agent_kind);
      if (params.reveal) searchParams.append('reveal', 'true');

      const url = `${API_BASE}/runs${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Live API unavailable, falling back to bundled demo data:', err);
      return api.getRuns({ ...params, reveal: params.reveal });
    }
  },

  async getRun(id: string, reveal = false): Promise<Run> {
    if (currentMode === 'demo' || currentMode === 'mock') {
      const run = inMemoryRuns.find((r) => r.id === id);
      if (!run) throw new Error(`Run '${id}' not found`);
      if (!reveal) {
        return { ...run, fault: null };
      }
      return run;
    }

    try {
      const res = await fetch(`${API_BASE}/runs/${id}${reveal ? '?reveal=true' : ''}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Live API error, falling back to local dataset:', err);
      const run = inMemoryRuns.find((r) => r.id === id);
      if (!run) throw new Error(`Run '${id}' not found`);
      return reveal ? run : { ...run, fault: null };
    }
  },

  async diagnoseRun(id: string): Promise<Diagnosis> {
    if (currentMode === 'demo' || currentMode === 'mock') {
      if (inMemoryDiagnoses[id]) {
        return inMemoryDiagnoses[id];
      }
      // Dynamic fallback diagnosis for custom/new runs in demo mode
      const run = inMemoryRuns.find((r) => r.id === id);
      if (!run) throw new Error(`Run '${id}' not found`);
      return generateClientFallbackDiagnosis(run);
    }

    try {
      const res = await fetch(`${API_BASE}/runs/${id}/diagnose`, { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Live diagnose API error, falling back to local diagnosis generator:', err);
      const run = inMemoryRuns.find((r) => r.id === id);
      if (!run) throw new Error(`Run '${id}' not found`);
      return inMemoryDiagnoses[id] || generateClientFallbackDiagnosis(run);
    }
  },

  async getEvalResults(): Promise<EvalResults> {
    if (currentMode === 'demo' || currentMode === 'mock') {
      return DEMO_BUNDLE_DATA.eval_results;
    }

    try {
      const res = await fetch(`${API_BASE}/eval`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Live eval API error, falling back to bundled eval metrics:', err);
      return DEMO_BUNDLE_DATA.eval_results;
    }
  },

  async getDemoBundle(): Promise<DemoBundle> {
    if (currentMode === 'demo' || currentMode === 'mock') {
      return DEMO_BUNDLE_DATA;
    }

    try {
      const res = await fetch(`${API_BASE}/demo/bundle`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return await res.json();
    } catch (err) {
      return DEMO_BUNDLE_DATA;
    }
  },

  async saveRun(run: Run): Promise<Run> {
    const existingIdx = inMemoryRuns.findIndex((r) => r.id === run.id);
    if (existingIdx >= 0) {
      inMemoryRuns[existingIdx] = run;
    } else {
      inMemoryRuns.unshift(run);
    }

    if (currentMode === 'live') {
      try {
        const res = await fetch(`${API_BASE}/runs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(run),
        });
        if (res.ok) return await res.json();
      } catch (e) {
        console.warn('Failed to persist run to live backend:', e);
      }
    }
    return run;
  }
};

function generateClientFallbackDiagnosis(run: Run): Diagnosis {
  const steps = run.steps;
  const suspectStepIdx = run.suspect_step || (steps.find(s => s.error_flag)?.step_idx) || (steps[0]?.step_idx ?? 1);
  const suspectStep = steps.find(s => s.step_idx === suspectStepIdx) || steps[0];

  const causalNodes = [
    {
      step_idx: suspectStep.step_idx,
      step_name: suspectStep.step_name,
      step_type: suspectStep.step_type,
      description: `Anomaly initiated at step ${suspectStep.step_idx}`,
      variable_affected: suspectStep.writes.join(', ') || undefined,
      state_diff: suspectStep.state_delta ? JSON.stringify(suspectStep.state_delta) : undefined
    }
  ];

  if (steps.length > 1 && steps[steps.length - 1].step_idx !== suspectStep.step_idx) {
    const last = steps[steps.length - 1];
    causalNodes.push({
      step_idx: last.step_idx,
      step_name: last.step_name,
      step_type: last.step_type,
      description: `Execution terminated with: ${last.error_message || 'FAILED'}`,
      variable_affected: last.reads.join(', ') || undefined,
      state_diff: undefined
    });
  }

  return {
    run_id: run.id,
    suspect_step: suspectStep.step_idx,
    suspect_step_name: suspectStep.step_name,
    relative_blame: 0.65,
    blame_ranking: steps.map((s, idx) => ({
      step_idx: s.step_idx,
      step_name: s.step_name,
      score: s.step_idx === suspectStep.step_idx ? 0.65 : Math.max(0.01, 0.35 / (idx + 1))
    })),
    evidence: [
      {
        name: 'Step Anomaly Flag',
        observed: suspectStep.error_message || 'Irregular state mutation detected',
        typical_or_expected: 'Nominal output contract',
        category: 'semantic'
      }
    ],
    causal_chain: {
      nodes: causalNodes,
      final_impact: run.outcome_summary
    },
    suggested_patch: `Review logic and parameters in step ${suspectStep.step_idx} (${suspectStep.step_name})`
  };
}
