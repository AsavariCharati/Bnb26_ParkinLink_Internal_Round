from __future__ import annotations

from agent.gemini_agent import GeminiAgent, build_p1_task, correct_retrieval_patch
from core.models import Fault
from ml.diagnose import load_runs, diagnose_run
from replay.diff import diff_runs
from replay.live_replay import LiveReplayEngine
from tests.mock_gemini import MockGeminiClient
from replay.causal import run_causal_check

def test_real_pipeline_shape_and_replay():
    agent = GeminiAgent(MockGeminiClient())
    task = build_p1_task()
    fault = Fault(
        injected=True,
        step_idx=1,
        fault_type="wrong_retrieval",
        description="Wrong policy doc",
    )
    run = agent.run(task, fault=fault)
    assert run.agent_kind == "llm"
    assert run.status == "failed"
    assert [s.step_idx for s in run.steps] == [0, 1, 2, 3, 4]
    assert run.final_answer == "Refund eligible"

    diagnosis = diagnose_run(run, load_runs())
    assert diagnosis.suspect_step_idx in range(5)

    engine = LiveReplayEngine(agent)
    fixed, replay = engine.replay(
        run,
        1,
        {"target": "output", "value": correct_retrieval_patch()},
    )
    assert replay.prefix_reused == 1
    assert replay.steps_rerun == 4
    assert fixed.status == "success"
    assert fixed.final_answer == "Refund not eligible"

    diff = diff_runs(run, fixed)
    assert diff.first_divergence == 1


def test_replay_preserves_prefix_and_reruns_only_suffix():
    agent = GeminiAgent(MockGeminiClient())
    task = build_p1_task()
    fault = Fault(
        injected=True,
        step_idx=1,
        fault_type="wrong_retrieval",
        description="Wrong policy doc",
    )

    original = agent.run(task, fault=fault)
    original_step_0 = original.steps[0].model_dump(mode="json")

    engine = LiveReplayEngine(agent)
    replayed, result = engine.replay(
        original,
        from_step=1,
        patch={"target": "output", "value": correct_retrieval_patch()},
    )

    # The checkpoint prefix must be reused without modification.
    assert replayed.steps[0].model_dump(mode="json") == original_step_0

    # Only the suffix should be rerun.
    assert result.prefix_reused == 1
    assert result.steps_rerun == 4
    assert [step.step_idx for step in replayed.steps] == [0, 1, 2, 3, 4]

    # The replay should repair the known injected retrieval fault.
    assert replayed.status == "success"


def test_state_patch_is_applied_to_reused_checkpoint():
    agent = GeminiAgent(MockGeminiClient())
    task = build_p1_task()

    # Create a clean original run so step 1 has a reusable prefix.
    original = agent.run(task)
    engine = LiveReplayEngine(agent)

    # Change a state value at the step-1 checkpoint.
    replayed, result = engine.replay(
        original,
        from_step=1,
        patch={
            "target": "state",
            "value": {"checkpoint_test_marker": "patched"},
        },
    )

    # The marker must survive into the replayed suffix.
    assert (
        replayed.steps[1].state_after.get("checkpoint_test_marker")
        == "patched"
    )
    assert result.prefix_reused == 1
    assert result.steps_rerun == 4


def test_causal_check_distinguishes_repair_from_unrelated_intervention():
    agent = GeminiAgent(MockGeminiClient())
    task = build_p1_task()
    fault = Fault(
        injected=True,
        step_idx=1,
        fault_type="wrong_retrieval",
        description="Wrong policy doc",
    )

    original = agent.run(task, fault=fault)
    engine = LiveReplayEngine(agent)

    check, fixed_run, unrelated_run = run_causal_check(
        engine=engine,
        original=original,
        suspect_step=1,
        suspect_patch={
            "target": "output",
            "value": correct_retrieval_patch(),
        },
        unrelated_step=0,
    )

    # The relevant repair should fix the original failure.
    assert fixed_run.status == "success"

    # The unrelated intervention should not fix the original failure.
    assert unrelated_run.status == "failed"

    # Both trials should be recorded against the original run.
    assert check.run_id == original.run_id
    assert len(check.trials) == 2
    assert [trial.new_outcome for trial in check.trials] == [
        "success",
        "failed",
    ]
        # The unrelated intervention must not change the final outcome.
    assert unrelated_run.final_answer == original.final_answer

def test_output_patch_updates_parse_checkpoint_state():
    agent = GeminiAgent(MockGeminiClient())
    task = build_p1_task()

    original = agent.run(task)
    engine = LiveReplayEngine(agent)

    replayed, result = engine.replay(
        original,
        from_step=2,
        patch={
            "target": "output",
            "value": {"days": 30},
        },
    )

    # The patched step output and its resulting state must agree.
    assert replayed.steps[2].output["days"] == 30
    assert replayed.steps[2].state_after["refund_days"] == 30

    assert result.prefix_reused == 2
    assert result.steps_rerun == 3


def test_state_patch_at_step_zero_reaches_replayed_trace():
    agent = GeminiAgent(MockGeminiClient())
    task = build_p1_task()
    original = agent.run(task)
    engine = LiveReplayEngine(agent)

    replayed, result = engine.replay(
        original,
        from_step=0,
        patch={
            "target": "state",
            "value": {"checkpoint_test_marker": "step_zero"},
        },
    )

    assert replayed.steps[0].state_after.get(
        "checkpoint_test_marker"
    ) == "step_zero"
    assert result.prefix_reused == 0
    assert result.steps_rerun == 5


def test_replay_from_step_two_preserves_entire_prefix():
    agent = GeminiAgent(MockGeminiClient())
    task = build_p1_task()
    original = agent.run(task)
    engine = LiveReplayEngine(agent)

    original_prefix = [
        step.model_dump(mode="json")
        for step in original.steps[:2]
    ]

    replayed, result = engine.replay(
        original,
        from_step=2,
        patch={
            "target": "output",
            "value": {"days": 30},
        },
    )

    replayed_prefix = [
        step.model_dump(mode="json")
        for step in replayed.steps[:2]
    ]

    assert replayed_prefix == original_prefix
    assert result.prefix_reused == 2
    assert result.steps_rerun == 3


def test_causal_noop_patch_does_not_change_original_output_fields():
    agent = GeminiAgent(MockGeminiClient())
    task = build_p1_task()
    original = agent.run(task)

    unrelated_step = 0
    original_output = original.steps[unrelated_step].output

    check, fixed_run, unrelated_run = run_causal_check(
        engine=LiveReplayEngine(agent),
        original=original,
        suspect_step=1,
        suspect_patch={
            "target": "output",
            "value": correct_retrieval_patch(),
        },
        unrelated_step=unrelated_step,
    )

    # The unrelated intervention should preserve the original output fields.
    for key, value in original_output.items():
        assert unrelated_run.steps[unrelated_step].output[key] == value

    assert len(check.trials) == 2


def test_causal_unrelated_patch_adds_no_marker_field():
    agent = GeminiAgent(MockGeminiClient())
    original = agent.run(build_p1_task())

    unrelated_step = 0
    original_output = original.steps[unrelated_step].output

    _, _, unrelated_run = run_causal_check(
        engine=LiveReplayEngine(agent),
        original=original,
        suspect_step=1,
        suspect_patch={
            "target": "output",
            "value": correct_retrieval_patch(),
        },
        unrelated_step=unrelated_step,
    )

    replayed_output = unrelated_run.steps[unrelated_step].output

    assert replayed_output == original_output
    assert "_blackbox_noop" not in replayed_output


def test_repeated_replay_with_same_patch_is_consistent():
    agent = GeminiAgent(MockGeminiClient())
    original = agent.run(build_p1_task())
    engine = LiveReplayEngine(agent)

    patch = {
        "target": "output",
        "value": correct_retrieval_patch(),
    }

    replay_a, result_a = engine.replay(
        original,
        from_step=1,
        patch=patch,
    )

    replay_b, result_b = engine.replay(
        original,
        from_step=1,
        patch=patch,
    )

    # Both replays should reach the same outcome.
    assert replay_a.status == replay_b.status
    assert replay_a.final_answer == replay_b.final_answer

    # The replayed suffix outputs should be consistent.
    outputs_a = [
        step.output for step in replay_a.steps[1:]
    ]
    outputs_b = [
        step.output for step in replay_b.steps[1:]
    ]
    assert outputs_a == outputs_b

    # Both runs should reuse and rerun the same number of steps.
    assert result_a.prefix_reused == result_b.prefix_reused == 1
    assert result_a.steps_rerun == result_b.steps_rerun == 4

