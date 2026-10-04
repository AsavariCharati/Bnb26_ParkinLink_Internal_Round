from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class Step(BaseModel):
    step_idx: int
    step_name: str
    step_type: str  # 'plan' | 'llm_call' | 'tool_call' | 'retrieval' | 'parse' | 'final_answer'
    input_data: Optional[Any] = None
    output_data: Optional[Any] = None
    state_delta: Optional[Dict[str, Any]] = None
    reads: List[str] = Field(default_factory=list)
    writes: List[str] = Field(default_factory=list)
    latency_ms: Optional[float] = None
    tokens: Optional[int] = None
    error_flag: bool = False
    error_message: Optional[str] = None
    raw_prompt: Optional[str] = None
    tool_name: Optional[str] = None


class FaultInfo(BaseModel):
    fault_type: str
    injected_step: int
    description: Optional[str] = None
    patch_recommendation: Optional[str] = None


class Run(BaseModel):
    id: str
    template: str
    agent_kind: str  # 'simulated' | 'openai' | 'anthropic' | 'custom'
    status: str      # 'PASSED' | 'FAILED'
    outcome_summary: str
    steps: List[Step] = Field(default_factory=list)
    created_at: str
    suspect_step: Optional[int] = None
    fault: Optional[FaultInfo] = None  # Hidden by default unless ?reveal=true


class CausalNode(BaseModel):
    step_idx: int
    step_name: str
    step_type: str
    description: str
    variable_affected: Optional[str] = None
    state_diff: Optional[str] = None


class CausalChain(BaseModel):
    nodes: List[CausalNode] = Field(default_factory=list)
    final_impact: str


class EvidenceItem(BaseModel):
    name: str
    observed: str
    typical_or_expected: str
    category: str = "output"  # 'output' | 'state' | 'timing' | 'semantic'


class BlameScore(BaseModel):
    step_idx: int
    step_name: str
    score: float  # Relative blame score (0.0 to 1.0)


class Diagnosis(BaseModel):
    run_id: str
    suspect_step: int
    suspect_step_name: str
    relative_blame: float  # Never called 'confidence'
    blame_ranking: List[BlameScore] = Field(default_factory=list)
    evidence: List[EvidenceItem] = Field(default_factory=list)
    causal_chain: CausalChain
    healthy_reference: Optional[Dict[str, Any]] = None
    suggested_patch: Optional[str] = None


class BaselineMetric(BaseModel):
    name: str
    top_1: float
    top_3: float
    mean_rank: float


class FaultTypeMetric(BaseModel):
    fault_type: str
    n_samples: int
    top_1: float
    top_3: float
    mean_rank: float


class FeatureImportanceItem(BaseModel):
    feature: str
    importance: float
    description: str


class EvalResults(BaseModel):
    is_example: bool = True
    overall_metrics: List[BaselineMetric] = Field(default_factory=list)
    seen_vs_unseen: Dict[str, Any] = Field(default_factory=dict)
    leave_one_template_out: List[Dict[str, Any]] = Field(default_factory=list)
    per_fault_type: List[FaultTypeMetric] = Field(default_factory=list)
    feature_importance: List[FeatureImportanceItem] = Field(default_factory=list)
    methodology: Dict[str, Any] = Field(default_factory=dict)
