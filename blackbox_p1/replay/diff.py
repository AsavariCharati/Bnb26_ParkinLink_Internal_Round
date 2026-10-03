from __future__ import annotations

from typing import Any

from core.models import Diff, DiffStep, Run


def _same(a: Any, b: Any) -> bool:
    return a == b


def diff_runs(a: Run, b: Run) -> Diff:
    steps = []
    first_divergence = None
    max_len = max(len(a.steps), len(b.steps))

    for i in range(max_len):
        sa = a.steps[i] if i < len(a.steps) else None
        sb = b.steps[i] if i < len(b.steps) else None
        ao = sa.output if sa else None
        bo = sb.output if sb else None
        same = sa is not None and sb is not None and _same(ao, bo)
        if not same and first_divergence is None:
            first_divergence = i
        steps.append(
            DiffStep(
                idx=i,
                status="same" if same else "changed",
                a_output=ao,
                b_output=bo,
            )
        )

    return Diff(
        a=a.run_id,
        b=b.run_id,
        first_divergence=first_divergence,
        outcome={"a": a.status, "b": b.status},
        steps=steps,
    )
