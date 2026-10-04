from core.models import Run, Step, Task
from replay.diff import diff_runs


def make_run(run_id, outputs, status="success"):
    steps = [
        Step(
            step_idx=i,
            type="plan",
            name=f"step_{i}",
            output=output,
        )
        for i, output in enumerate(outputs)
    ]

    return Run(
        run_id=run_id,
        task=Task(
            template="test",
            task_seed=1,
            prompt="Test prompt",
            expected_answer="expected",
        ),
        status=status,
        final_answer="expected",
        steps=steps,
    )


def test_diff_identical_runs_has_no_divergence():
    run_a = make_run("run-a", ["plan", "retrieve", "answer"])
    run_b = make_run("run-b", ["plan", "retrieve", "answer"])

    result = diff_runs(run_a, run_b)

    assert result.first_divergence is None
    assert all(step.status == "same" for step in result.steps)


def test_diff_detects_first_changed_output():
    run_a = make_run("run-a", ["plan", "wrong document", "answer"])
    run_b = make_run("run-b", ["plan", "correct document", "answer"])

    result = diff_runs(run_a, run_b)

    assert result.first_divergence == 1
    assert result.steps[0].status == "same"
    assert result.steps[1].status == "changed"


def test_diff_marks_extra_step_as_changed():
    run_a = make_run("run-a", ["plan", "answer"])
    run_b = make_run("run-b", ["plan", "tool call", "answer"])

    result = diff_runs(run_a, run_b)

    assert result.first_divergence == 1
    assert len(result.steps) == 3
    assert result.steps[1].status == "changed"
    assert result.steps[2].status == "changed"


def test_diff_detects_state_change_when_output_is_identical():
    run_a = make_run("run-a", ["plan", "answer"])
    run_b = make_run("run-b", ["plan", "answer"])

    run_a.steps[1].state_after = {"refund_days": 7}
    run_b.steps[1].state_after = {"refund_days": 30}

    result = diff_runs(run_a, run_b)

    assert result.first_divergence == 1
    assert result.steps[1].status == "changed"
