from __future__ import annotations

import uuid
from copy import deepcopy
from typing import Any

from agent.gemini_agent import GeminiAgent, correct_retrieval_patch
from core.models import Fault, Lineage, ReplayResult, Run


class LiveReplayEngine:
    """Fork a real Gemini trace from a checkpoint and rerun only its suffix."""

    def __init__(self, agent: GeminiAgent) -> None:
        self.agent = agent

    def replay(
        self,
        original: Run,
        from_step: int,
        patch: dict[str, Any],
        *,
        keep_faults: bool = True,
    ) -> tuple[Run, ReplayResult]:
        if from_step < 0 or from_step >= len(original.steps):
            raise ValueError(f"from_step must be in [0, {len(original.steps) - 1}]")

        prefix = [deepcopy(s) for s in original.steps if s.step_idx < from_step]
        initial_state = deepcopy(prefix[-1].state_after) if prefix else {}

        # If the patch targets the fault step, the replay uses the patch instead
        # of re-injecting that fault. For an unrelated-step patch, the original
        # fault remains active so the causal check can test whether that patch
        # actually mattered.
        fault = deepcopy(original.fault)
        fault_enabled = bool(keep_faults and fault.injected and fault.step_idx != from_step)

        patched_outputs: dict[int, Any] = {}
        if patch.get("target") == "output":
            patched_outputs[from_step] = deepcopy(patch.get("value"))
        elif patch.get("target") == "state":
            # For P1, state patches are applied before the checkpointed suffix.
            if from_step == 0:
                initial_state = deepcopy(patch.get("value") or {})
            else:
                initial_state = deepcopy(prefix[-1].state_after if prefix else {})
                initial_state.update(deepcopy(patch.get("value") or {}))
        else:
            # Input patches are recorded for traceability. The P1 workflow has
            # deterministic tool queries, so output/state is the recommended
            # patch target for the demo.
            if "value" in patch:
                patched_outputs[from_step] = deepcopy(patch["value"])

        lineage = Lineage(
            parent_run_id=original.run_id,
            forked_from_step=from_step,
            patch=deepcopy(patch),
        )
        replayed = self.agent.run(
            original.task,
            fault=fault,
            lineage=lineage,
            reused_prefix=prefix,
            initial_state=initial_state,
            start_step=from_step,
            patched_outputs=patched_outputs,
            fault_enabled=fault_enabled,
            run_id_prefix=f"{original.run_id}_r{uuid.uuid4().hex[:6]}",
        )

        result = ReplayResult(
            new_run_id=replayed.run_id,
            forked_from_step=from_step,
            prefix_reused=len(prefix),
            steps_rerun=len(replayed.steps) - len(prefix),
            cache_hits=len(prefix),
            original_outcome=original.status,
            new_outcome=replayed.status,
            replay_mode="live",
            patch=deepcopy(patch),
        )
        return replayed, result

    @staticmethod
    def canonical_policy_patch() -> dict[str, Any]:
        return {
            "target": "output",
            "value": correct_retrieval_patch(),
        }
