from collections import deque
from typing import List, Set
from fastapi import APIRouter, HTTPException, Path
from backend.schemas import (
    BlameScore,
    CausalChain,
    CausalNode,
    Diagnosis,
    EvidenceItem,
    Run,
    Step,
)
from backend.storage import storage

router = APIRouter(prefix="/api/runs", tags=["diagnose"])


def build_causal_chain(run: Run, suspect_step_idx: int) -> CausalChain:
    """
    Constructs a deterministic causal chain via BFS starting from suspect_step.
    Tracks variables written by suspect and finds downstream steps whose `reads`
    consume variables in the affected variable set. Stops at `final_answer`.
    """
    steps_by_idx = {s.step_idx: s for s in run.steps}
    suspect = steps_by_idx.get(suspect_step_idx)
    if not suspect:
        return CausalChain(nodes=[], final_impact=run.outcome_summary)

    active_poisoned_vars: Set[str] = set(suspect.writes)
    if suspect.state_delta:
        active_poisoned_vars.update(suspect.state_delta.keys())

    causal_nodes: List[CausalNode] = [
        CausalNode(
            step_idx=suspect.step_idx,
            step_name=suspect.step_name,
            step_type=suspect.step_type,
            description=f"Initial anomaly occurred at step {suspect.step_idx} ({suspect.step_name})",
            variable_affected=", ".join(active_poisoned_vars) if active_poisoned_vars else None,
            state_diff=str(suspect.state_delta) if suspect.state_delta else None,
        )
    ]

    # Inspect all downstream steps in chronological order
    for step in run.steps:
        if step.step_idx <= suspect_step_idx:
            continue

        reads_poisoned = any(var in active_poisoned_vars for var in step.reads)
        is_final = step.step_type == "final_answer" or step.step_idx == run.steps[-1].step_idx

        if reads_poisoned or (is_final and causal_nodes):
            # Step is influenced by upstream causal poison
            affected_vars = [v for v in step.reads if v in active_poisoned_vars]
            var_desc = ", ".join(affected_vars) if affected_vars else "terminal flow"

            # Add this step's writes to poisoned set
            active_poisoned_vars.update(step.writes)
            if step.state_delta:
                active_poisoned_vars.update(step.state_delta.keys())

            desc = f"Consumed poisoned state/output ({var_desc})"
            if is_final:
                desc = f"Emitted final outcome affected by upstream error: {step.error_message or 'Failure state'}"

            causal_nodes.append(
                CausalNode(
                    step_idx=step.step_idx,
                    step_name=step.step_name,
                    step_type=step.step_type,
                    description=desc,
                    variable_affected=var_desc,
                    state_diff=str(step.output_data) if step.output_data else None,
                )
            )

            if is_final:
                break

    return CausalChain(
        nodes=causal_nodes,
        final_impact=run.outcome_summary or "Execution reached suboptimal outcome",
    )


def compute_fallback_diagnosis(run: Run) -> Diagnosis:
    """
    Fallback deterministic heuristic when Person A's ML model is not loaded:
    1. Look for first step with error_flag == True (excluding final_answer if other errors exist)
    2. Otherwise look for step with largest state_delta or latency anomaly
    """
    steps = run.steps
    if not steps:
        raise HTTPException(status_code=400, detail="Run contains no steps")

    # If run has an explicit suspect_step preset
    suspect_step_idx = run.suspect_step

    if suspect_step_idx is None:
        # 1. First step with error_flag == true before final_answer
        error_steps = [s for s in steps if s.error_flag and s.step_type != "final_answer"]
        if error_steps:
            suspect_step_idx = error_steps[0].step_idx
        elif any(s.error_flag for s in steps):
            suspect_step_idx = [s for s in steps if s.error_flag][0].step_idx
        else:
            # 2. Heuristic: step with largest output/state payload or latency
            best_step = max(
                steps[:-1] if len(steps) > 1 else steps,
                key=lambda s: len(str(s.output_data or "")) + (s.latency_ms or 0),
            )
            suspect_step_idx = best_step.step_idx

    suspect_step = next((s for s in steps if s.step_idx == suspect_step_idx), steps[0])

    # Construct blame rankings
    blame_ranking: List[BlameScore] = []
    base_blame = 0.65
    blame_ranking.append(
        BlameScore(
            step_idx=suspect_step.step_idx,
            step_name=suspect_step.step_name,
            score=base_blame,
        )
    )

    remaining_score = 1.0 - base_blame
    other_steps = [s for s in steps if s.step_idx != suspect_step.step_idx]
    for i, s in enumerate(other_steps):
        decay = remaining_score * (0.5 ** (i + 1))
        blame_ranking.append(
            BlameScore(
                step_idx=s.step_idx,
                step_name=s.step_name,
                score=round(decay, 3),
            )
        )

    # Construct evidence items
    evidence: List[EvidenceItem] = []
    if suspect_step.error_flag:
        evidence.append(
            EvidenceItem(
                name="Error flag triggered",
                observed=suspect_step.error_message or "Execution exception",
                typical_or_expected="Clean execution with status 0",
                category="semantic",
            )
        )

    if suspect_step.output_data:
        evidence.append(
            EvidenceItem(
                name="Output value anomaly",
                observed=str(suspect_step.output_data)[:80],
                typical_or_expected="Expected nominal schema structure",
                category="output",
            )
        )

    if suspect_step.state_delta:
        evidence.append(
            EvidenceItem(
                name="State delta divergence",
                observed=str(suspect_step.state_delta)[:80],
                typical_or_expected="State matching nominal execution path",
                category="state",
            )
        )

    causal_chain = build_causal_chain(run, suspect_step.step_idx)

    return Diagnosis(
        run_id=run.id,
        suspect_step=suspect_step.step_idx,
        suspect_step_name=suspect_step.step_name,
        relative_blame=base_blame,
        blame_ranking=blame_ranking,
        evidence=evidence,
        causal_chain=causal_chain,
        healthy_reference={
            "step_idx": suspect_step.step_idx,
            "typical_latency_ms": 150.0,
            "expected_state": "nominal",
        },
        suggested_patch=f"Validate inputs and verify schema output at step {suspect_step.step_idx} ({suspect_step.step_name})",
    )


@router.post("/{id}/diagnose", response_model=Diagnosis)
def diagnose_run(id: str = Path(..., description="The run ID to diagnose")):
    # Look up run (fault hidden)
    run = storage.get_run(id, reveal=False)
    if not run:
        raise HTTPException(status_code=404, detail=f"Run '{id}' not found")

    return compute_fallback_diagnosis(run)
