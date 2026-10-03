from __future__ import annotations

from agent.gemini_agent import GeminiAgent, build_p1_task, correct_retrieval_patch
from core.models import Fault
from ml.diagnose import load_runs, diagnose_run
from replay.diff import diff_runs
from replay.live_replay import LiveReplayEngine
from tests.mock_gemini import MockGeminiClient


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
