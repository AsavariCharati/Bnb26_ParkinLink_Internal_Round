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
    """Perform the two-trial P1 causal check required by the demo.

    Trial A patches the suspected fault step.
    Trial B patches an unrelated step and should leave the failure intact.
    """
    fixed_run, fixed_replay = engine.replay(original, suspect_step, suspect_patch, keep_faults=True)

    unrelated_original = original.steps[unrelated_step].output
    if isinstance(unrelated_original, dict):
        unrelated_patch_value = deepcopy(unrelated_original)
        unrelated_patch_value["_blackbox_noop"] = True
    else:
        unrelated_patch_value = unrelated_original

    unrelated_patch = {"target": "output", "value": unrelated_patch_value}
    unrelated_run, unrelated_replay = engine.replay(
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
                patch="no-op patch on unrelated step",
                new_outcome=unrelated_run.status,
            ),
        ],
    )
    return check, fixed_run, unrelated_run
