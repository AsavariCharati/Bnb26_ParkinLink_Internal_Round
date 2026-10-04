from __future__ import annotations

import json
import pickle
import random
from copy import deepcopy
from pathlib import Path

import numpy as np
from sklearn.model_selection import GroupShuffleSplit
from xgboost import XGBClassifier

from agent.gemini_agent import GeminiAgent, build_p1_task
from agent.scenarios import SCENARIOS, get_fault_config
from core.models import Fault, Run, Task
from ml.features import FEATURE_NAMES, build_clean_stats, runs_to_matrix
from tests.mock_gemini import MockGeminiClient

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "p1_training_runs.jsonl"
MODEL_PATH = ROOT / "data" / "p1_model.pkl"


def make_runs() -> list[Run]:
    agent = GeminiAgent(MockGeminiClient())
    runs: list[Run] = []
    rng = random.Random(20261004)

    for scenario_index, name in enumerate(SCENARIOS):
        cfg = get_fault_config(name)
        base_task = build_p1_task(name)

        # 120 clean + 120 faulty examples per scenario. Seeds vary so train/test
        # groups are disjoint even though the deterministic business values stay stable.
        seeds = list(range(1, 121))
        rng.shuffle(seeds)
        for i, seed in enumerate(seeds):
            task = Task(
                template=base_task.template,
                task_seed=base_task.task_seed + seed,
                prompt=base_task.prompt,
                expected_answer=base_task.expected_answer,
            )

            clean = agent.run(task, fault=Fault(injected=False), run_id_prefix=f"p1c{scenario_index}")
            runs.append(clean)

            faulty = agent.run(
                task,
                fault=Fault(
                    injected=True,
                    step_idx=cfg["fault_step"],
                    fault_type=cfg["fault_type"],
                    description=cfg["description"],
                ),
                run_id_prefix=f"p1f{scenario_index}",
            )
            runs.append(faulty)

    return runs


def main() -> None:
    runs = make_runs()
    DATA_PATH.write_text(
        "\n".join(json.dumps(run.model_dump(), ensure_ascii=False) for run in runs) + "\n",
        encoding="utf-8",
    )

    clean_runs = [run for run in runs if not run.fault.injected and run.status == "success"]
    clean_stats = build_clean_stats(clean_runs)
    X, y, metadata = runs_to_matrix(runs, clean_stats)
    X = np.asarray(X, dtype=float)
    y = np.asarray(y, dtype=int)

    groups = np.asarray([f"{m['template']}:{m['task_seed']//20}" for m in metadata])
    splitter = GroupShuffleSplit(n_splits=1, test_size=0.20, random_state=42)
    train_idx, test_idx = next(splitter.split(X, y, groups=groups))

    base_model_path = ROOT / "data" / "model.pkl"
    with base_model_path.open("rb") as handle:
        base_payload = pickle.load(handle)
    base_model = base_payload["model"]

    # Continue from the P0 booster rather than replacing it. This keeps the
    # original P0 model untouched while adapting the same XGBoost architecture
    # to the real P1 trace distribution.
    model = XGBClassifier(
        n_estimators=60,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.9,
        colsample_bytree=0.9,
        objective="binary:logistic",
        eval_metric="logloss",
        random_state=42,
        n_jobs=1,
    )
    pos = int(y[train_idx].sum())
    neg = int(len(train_idx) - pos)
    model.set_params(scale_pos_weight=neg / max(pos, 1))
    model.fit(X[train_idx], y[train_idx], xgb_model=base_model.get_booster())

    payload = {
        "model": model,
        "feature_names": FEATURE_NAMES,
        "clean_stats": clean_stats,
        "base_model": "data/model.pkl",
        "train_examples": int(len(train_idx)),
        "test_examples": int(len(test_idx)),
        "version": "p1_calibrated_from_p0",
    }
    with MODEL_PATH.open("wb") as handle:
        pickle.dump(payload, handle)

    probs = model.predict_proba(X[test_idx])[:, 1]
    order_by_run: dict[str, list[tuple[int, float, int]]] = {}
    for local, idx in enumerate(test_idx):
        m = metadata[idx]
        order_by_run.setdefault(m["run_id"], []).append((m["step_idx"], float(probs[local]), y[idx]))

    correct = 0
    faulty_count = 0
    for run in runs:
        if run.run_id not in order_by_run or not run.fault.injected:
            continue
        rows = sorted(order_by_run[run.run_id], key=lambda x: x[1], reverse=True)
        predicted = rows[0][0]
        faulty_count += 1
        correct += int(predicted == run.fault.step_idx)

    print("P1 CALIBRATION COMPLETE")
    print("Runs:", len(runs))
    print("Train rows:", len(train_idx))
    print("Test rows:", len(test_idx))
    print("Held-out faulty Top-1: {:.2%}".format(correct / max(faulty_count, 1)))
    print("Saved:", MODEL_PATH)
    print("Dataset:", DATA_PATH)


if __name__ == "__main__":
    main()
