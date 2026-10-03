from __future__ import annotations
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field

StepType = Literal["plan","llm_call","tool_call","retrieval","parse","final_answer"]

class Task(BaseModel):
    template: str
    task_seed: int
    prompt: str
    expected_answer: str

class Fault(BaseModel):
    injected: bool = False
    step_idx: Optional[int] = None
    fault_type: Optional[str] = None
    description: Optional[str] = None

class Lineage(BaseModel):
    parent_run_id: Optional[str] = None
    forked_from_step: Optional[int] = None
    patch: Optional[Dict[str, Any]] = None

class Meta(BaseModel):
    split: str = "train"
    is_decoy: bool = False
    model: Optional[str] = None
    temperature: Optional[float] = None

class Step(BaseModel):
    step_idx: int
    type: StepType
    name: str
    prompt: Optional[str] = None
    input: Any = None
    output: Any = None
    error_flag: bool = False
    error_msg: Optional[str] = None
    latency_ms: int = 0
    tokens: int = 0
    reads: List[Dict[str, Any]] = Field(default_factory=list)
    writes: List[str] = Field(default_factory=list)
    state_after: Dict[str, Any] = Field(default_factory=dict)
    pre_state_hash: str = ""
    cache_key: str = ""

class Run(BaseModel):
    run_id: str
    task: Task
    status: Literal["success","failed"]
    final_answer: str
    agent_kind: Literal["simulated","llm"] = "simulated"
    steps: List[Step] = Field(default_factory=list)
    fault: Fault = Field(default_factory=Fault)
    lineage: Lineage = Field(default_factory=Lineage)
    meta: Meta = Field(default_factory=Meta)

class Patch(BaseModel):
    step_idx: int
    target: Literal["input","output","state"]
    value: Any

class RankingItem(BaseModel):
    step_idx: int
    blame_score: float
    relative: float

class Evidence(BaseModel):
    feature: str
    value: Any
    typical: Any

class HealthyReference(BaseModel):
    run_id: str
    step_idx: int
    output: Any

class Diagnosis(BaseModel):
    run_id: str
    ranking: List[RankingItem]
    suspect_step_idx: int
    evidence: List[Evidence] = Field(default_factory=list)
    healthy_reference: Optional[HealthyReference] = None
    causal_chain: List[int] = Field(default_factory=list)

class ReplayResult(BaseModel):
    new_run_id: str
    forked_from_step: int
    prefix_reused: int
    steps_rerun: int
    cache_hits: int
    original_outcome: str
    new_outcome: str
    replay_mode: Literal["deterministic","live"] = "deterministic"
    patch: Dict[str, Any] = Field(default_factory=dict)

class CausalTrial(BaseModel):
    step_idx: int
    patch: str
    new_outcome: str

class CausalCheck(BaseModel):
    run_id: str
    trials: List[CausalTrial]

class DiffStep(BaseModel):
    idx: int
    status: Literal["same","changed"]
    a_output: Any = None
    b_output: Any = None

class Diff(BaseModel):
    a: str
    b: str
    first_divergence: Optional[int]
    outcome: Dict[str, str]
    steps: List[DiffStep]

class EvalResults(BaseModel):
    is_example: bool = False
    n_train: int = 0
    n_test: int = 0
    top1: float = 0.0
    top3: float = 0.0
    mean_rank: float = 0.0
    baselines: Dict[str, float] = Field(default_factory=dict)
    unseen_fault_types: Dict[str, Any] = Field(default_factory=dict)
    leave_one_template_out: Dict[str, Any] = Field(default_factory=dict)
    real_llm_test: Optional[Dict[str, Any]] = None
    feature_importance: Dict[str, float] = Field(default_factory=dict)
