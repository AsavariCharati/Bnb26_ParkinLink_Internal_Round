from __future__ import annotations

from pathlib import Path


def test_all_original_p0_files_present():
    root = Path(__file__).resolve().parents[1]
    expected = [
        ".gitignore",
        "README_ML.md",
        "generation_test.txt",
        "requirements.txt",
        "core/__init__.py",
        "core/agent.py",
        "core/faults.py",
        "core/models.py",
        "core/sim_llm.py",
        "core/tools.py",
        "ml/__init__.py",
        "ml/diagnose.py",
        "ml/evaluate.py",
        "ml/features.py",
        "ml/train.py",
        "scripts/__init__.py",
        "scripts/generate_data.py",
        "data/runs.jsonl",
        "data/model.pkl",
        "data/eval_results.json",
    ]
    for rel in expected:
        assert (root / rel).exists(), rel
