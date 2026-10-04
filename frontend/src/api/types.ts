export type StepType = 'plan' | 'llm_call' | 'tool_call' | 'retrieval' | 'parse' | 'final_answer';

export interface Step {
  step_idx: int;
  step_name: string;
  step_type: StepType;
  input_data?: any;
  output_data?: any;
  state_delta?: Record<string, any>;
  reads: string[];
  writes: string[];
  latency_ms?: number;
  tokens?: number;
  error_flag: boolean;
  error_message?: string;
  raw_prompt?: string;
  tool_name?: string;
}

export type int = number;

export interface FaultInfo {
  fault_type: string;
  injected_step: number;
  description?: string;
  patch_recommendation?: string;
}

export interface Run {
  id: string;
  template: string;
  agent_kind: 'simulated' | 'openai' | 'anthropic' | 'custom';
  status: 'PASSED' | 'FAILED';
  outcome_summary: string;
  steps: Step[];
  created_at: string;
  suspect_step?: number | null;
  fault?: FaultInfo | null;
}

export interface CausalNode {
  step_idx: number;
  step_name: string;
  step_type: StepType;
  description: string;
  variable_affected?: string | null;
  state_diff?: string | null;
}

export interface CausalChain {
  nodes: CausalNode[];
  final_impact: string;
}

export interface EvidenceItem {
  name: string;
  observed: string;
  typical_or_expected: string;
  category: 'output' | 'state' | 'timing' | 'semantic';
}

export interface BlameScore {
  step_idx: number;
  step_name: string;
  score: number;
}

export interface Diagnosis {
  run_id: string;
  suspect_step: number;
  suspect_step_name: string;
  relative_blame: number; // NEVER named confidence
  blame_ranking: BlameScore[];
  evidence: EvidenceItem[];
  causal_chain: CausalChain;
  healthy_reference?: Record<string, any> | null;
  suggested_patch?: string | null;
}

export interface BaselineMetric {
  name: string;
  top_1: number;
  top_3: number;
  mean_rank: number;
}

export interface FaultTypeMetric {
  fault_type: string;
  n_samples: number;
  top_1: number;
  top_3: number;
  mean_rank: number;
}

export interface FeatureImportanceItem {
  feature: string;
  importance: number;
  description: string;
}

export interface EvalResults {
  is_example: boolean;
  overall_metrics: BaselineMetric[];
  seen_vs_unseen: {
    seen_fault_types: {
      top_1: number;
      top_3: number;
      mean_rank: number;
      n_samples: number;
    };
    unseen_fault_types: {
      top_1: number;
      top_3: number;
      mean_rank: number;
      n_samples: number;
    };
  };
  leave_one_template_out: Array<{
    held_out_template: string;
    train_accuracy_top1: number;
    test_accuracy_top1: number;
    test_accuracy_top3: number;
    n_test: number;
  }>;
  per_fault_type: FaultTypeMetric[];
  feature_importance: FeatureImportanceItem[];
  methodology: Record<string, string>;
}

export interface DemoBundle {
  version: string;
  generated_at: string;
  runs: Run[];
  diagnoses: Record<string, Diagnosis>;
  eval_results: EvalResults;
}

export interface RunFilterParams {
  status?: string;
  fault_type?: string;
  template?: string;
  agent_kind?: string;
  reveal?: boolean;
}
