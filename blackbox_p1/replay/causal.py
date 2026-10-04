from __future__ import annotations

from copy import deepcopy
from typing import Any

from core.models import CausalCheck, CausalTrial, Run

from .live_replay import LiveReplayEngine


def run_causal_check(
    engine: LiveReplayEngine,
    original: Run,
    suspect_step: int,
    suspect_patch: dict[str, Any],
    unrelated_step: int,
) -> tuple[CausalCheck, Run, Run]:
    """Perform a two-trial causal check.

    Trial A patches the suspected fault step.
    Trial B replays with the original output at an unrelated step.
    """
    if not 0 <= suspect_step < len(original.steps):
        raise ValueError(f"Invalid suspect_step: {suspect_step}")

    if not 0 <= unrelated_step < len(original.steps):
        raise ValueError(f"Invalid unrelated_step: {unrelated_step}")

    if suspect_step == unrelated_step:
        raise ValueError("suspect_step and unrelated_step must differ")

    fixed_run, _ = engine.replay(
        original,
        suspect_step,
        suspect_patch,
        keep_faults=True,
    )

    # Reapply the exact original output: no marker or extra field.
    unrelated_original = deepcopy(original.steps[unrelated_step].output)
    unrelated_patch = {
        "target": "output",
        "value": unrelated_original,
    }

    unrelated_run, _ = engine.replay(
        original,
        unrelated_step,
        unrelated_patch,
        keep_faults=True,
    )

    check = CausalCheck(
        run_id=original.run_id,
        trials=[
            CausalTrial(
                step_idx=suspect_step,
                patch="repair suspected step",
                new_outcome=fixed_run.status,
            ),
            CausalTrial(
                step_idx=unrelated_step,
                patch="reapply original output at unrelated step",
                new_outcome=unrelated_run.status,
            ),
        ],
    )

    return check, fixed_run, unrelated_run
