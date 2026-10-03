from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REQUIRED = [
    # Original P0 files
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
    "ml/p1_adapter.py",
    "scripts/__init__.py",
    "scripts/generate_data.py",
    "data/runs.jsonl",
    "data/model.pkl",
    "data/eval_results.json",
    # P1 files
    "README.md",
    ".env.example",
    "agent/__init__.py",
    "agent/gemini_client.py",
    "agent/gemini_agent.py",
    "replay/__init__.py",
    "replay/live_replay.py",
    "replay/diff.py",
    "replay/causal.py",
    "contracts/sample_p1_task.json",
    "contracts/sample_p1_patch.json",
    "tests/__init__.py",
    "tests/mock_gemini.py",
    "tests/test_p1_mock.py",
    "tests/test_p0_contract.py",
    "scripts/run_p1.py",
    "scripts/check_p1.py",
]

missing = [rel for rel in REQUIRED if not (ROOT / rel).exists()]
if missing:
    raise SystemExit("Missing files:\n" + "\n".join(missing))

print(f"P1 PACKAGE OK: {len(REQUIRED)} required files present")
print("P0 model:", (ROOT / "data/model.pkl").stat().st_size, "bytes")
print("P0 dataset:", (ROOT / "data/runs.jsonl").stat().st_size, "bytes")
