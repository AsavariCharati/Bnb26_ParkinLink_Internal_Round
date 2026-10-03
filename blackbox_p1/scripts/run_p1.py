from __future__ import annotations

import argparse
import json
import os
import pickle
from pathlib import Path

from agent.gemini_agent import GeminiAgent, build_p1_task, correct_retrieval_patch
from agent.gemini_client import GeminiClient
from ml.diagnose import diagnose_run, load_runs
from ml.p1_adapter import adapt_for_p0_model
from replay.causal import run_causal_check
from replay.diff import diff_runs
from replay.live_replay import LiveReplayEngine
from core.models import Fault

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data" / "p1_runs"
MODEL_PATH = ROOT / "data" / "model.pkl"


def load_model() -> dict:
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Missing {MODEL_PATH}. Copy your existing P0 data/model.pkl into data/."
        )
    with MODEL_PATH.open("rb") as f:
        return pickle.load(f)


def choose_unrelated(suspect: int) -> int:
    for idx in [0, 1, 2, 3, 4]:
        if idx != suspect:
            return idx
    raise RuntimeError("No unrelated step exists.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the Black Box P1 Gemini pipeline.")
    parser.add_argument("--mock", action="store_true", help="Use deterministic mock Gemini responses for local tests.")
    parser.add_argument("--fault", default="wrong_retrieval", choices=["wrong_retrieval"], help="P1 fault to inject.")
    args = parser.parse_args()

    task = build_p1_task()
    fault = Fault(
        injected=True,
        step_idx=1,
        fault_type=args.fault,
        description="A plausible but incorrect refund-policy document is returned.",
    )

    if args.mock:
        from tests.mock_gemini import MockGeminiClient
        client = MockGeminiClient()
    else:
        from dotenv import load_dotenv
        load_dotenv(ROOT / ".env")
        client = GeminiClient()

    agent = GeminiAgent(client)
    run = agent.run(task, fault=fault)

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    original_path = DATA_DIR / f"{run.run_id}.json"
    original_path.write_text(json.dumps(run.model_dump(), indent=2, default=str), encoding="utf-8")

    # Re-use the exact P0-trained model and clean-run statistics. Real Gemini
    # latency is retained in the trace, but the model input is adapted to the
    # P0 benchmark latency distribution so API wall-clock time cannot become a
    # false shortcut.
    p0_runs = load_runs()
    payload = load_model()
    model_input_run = adapt_for_p0_model(run, payload["clean_stats"])
    diagnosis = diagnose_run(model_input_run, p0_runs)

    print("\nBLACK BOX P1")
    print(f"Agent model : {getattr(client, 'model', 'mock')}")
    print(f"Run         : {run.run_id}")
    print(f"Outcome     : {run.status.upper()}")
    print(f"Answer      : {run.final_answer}")
    print(f"ML suspect  : Step {diagnosis.suspect_step_idx}")
    print("Ranking:")
    for item in diagnosis.ranking:
        print(f"  Step {item.step_idx}: blame={item.blame_score:.4f} relative={item.relative:.2%}")

    suspect = diagnosis.suspect_step_idx
    ground_truth_step = fault.step_idx
    replay_step = suspect
    replay_source = "ml_suspect"
    if replay_step != ground_truth_step:
        replay_step = ground_truth_step
        replay_source = "ground_truth_fallback"
        print(
            f"WARNING: ML suspect was Step {suspect}, but the injected fault is Step {ground_truth_step}. "
            "The script will use the known fault checkpoint only to keep the causal replay demonstrable."
        )

    patch = {"target": "output", "value": correct_retrieval_patch()}
    engine = LiveReplayEngine(agent)

    fixed_run, replay_result = engine.replay(run, replay_step, patch, keep_faults=True)
    diff = diff_runs(run, fixed_run)
    unrelated = choose_unrelated(replay_step)
    causal, _, unrelated_run = run_causal_check(
        engine,
        run,
        suspect,
        patch,
        unrelated,
    )

    output = {
        "original": run.model_dump(),
        "diagnosis": diagnosis.model_dump(),
        "replay_checkpoint_source": replay_source,
        "replay": replay_result.model_dump(),
        "fixed_run": fixed_run.model_dump(),
        "diff": diff.model_dump(),
        "causal_check": causal.model_dump(),
        "unrelated_run": unrelated_run.model_dump(),
    }
    result_path = DATA_DIR / "latest_p1_result.json"
    result_path.write_text(json.dumps(output, indent=2, default=str), encoding="utf-8")

    print("\nREPLAY")
    print(f"Checkpoint  : Step {replay_result.forked_from_step}")
    print(f"Prefix reuse: {replay_result.prefix_reused} step(s)")
    print(f"Steps rerun : {replay_result.steps_rerun}")
    print(f"Outcome     : {replay_result.original_outcome} -> {replay_result.new_outcome}")
    print(f"First diff  : Step {diff.first_divergence}")

    print("\nCAUSAL CHECK")
    for trial in causal.trials:
        print(f"  Step {trial.step_idx}: {trial.patch} -> {trial.new_outcome}")

    print(f"\nSaved: {result_path}")


if __name__ == "__main__":
    main()
