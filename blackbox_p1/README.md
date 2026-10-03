# Black Box — P1 (Gemini + ML Diagnosis + Live Replay)

This folder is the **P1 layer on top of the already-tested P0 ML project**.

P0 is preserved as-is: the same `core/`, `ml/`, `data/runs.jsonl`, `data/model.pkl`, and evaluation artifacts are included. P1 adds a real Gemini-backed execution path that produces the same five-step `Run/Step` contract used by the P0 model.

## What P1 demonstrates

```text
Prompt
  ↓
Real Gemini agent
  ↓
5-step observable trace
  ↓
Injected realistic failure
  ↓
Existing P0 XGBoost diagnosis
  ↓
Suspect checkpoint
  ↓
Live Gemini replay from that checkpoint
  ↓
Patch suspected step
  ↓
FAIL → SUCCESS
  ↓
Trace diff + causal check
```

The first P1 fault is deliberately narrow and reliable:

`wrong_retrieval` at Step 1 → a plausible 30-day refund document is returned instead of the 7-day document.

The five trace steps are fixed to match the P0 `policy_lookup` shape:

`0 plan → 1 retrieval → 2 parse → 3 llm_call → 4 final_answer`

## 1. Setup

Run PowerShell from this project root.

```powershell
python -m venv .venv
.venv\\Scripts\\Activate.ps1
pip install -r requirements.txt
```

Copy `.env.example` to `.env` and put your Gemini API key in it:

```text
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-3.8-flash
```

The `.env` file is ignored by git in a normal setup. **Never commit your API key.**

## 2. Use your same P0 model

The ZIP already contains `data/model.pkl` from the working P0 build.

If your local P0 `model.pkl` is the one you want to use, simply overwrite:

```text
data/model.pkl
```

No retraining is required for the first P1 test.

## 3. First run the offline plumbing test

This does not call Gemini. It verifies that the P1 trace, existing XGBoost model, replay engine, and diff work together.

```powershell
python -m scripts.run_p1 --mock
```

Expected flow:

```text
Original: failed
Diagnosis: suspect step
Replay: failed -> success
Prefix reuse: 1 step
Steps rerun: 4
Causal check: repaired suspect changes outcome; unrelated patch leaves failure
```

## 4. Run the real Gemini P1 demo

```powershell
python -m scripts.run_p1
```

This calls Gemini for planner, parser, reasoner, and final-answer stages. Retrieval is a local observable tool call so the fault can be injected exactly and replayed exactly.

The current default model is `gemini-3.8-flash`. The code does not set legacy sampling parameters such as temperature.

**P0 model compatibility:** the P0 XGBoost was trained on controlled benchmark latency values, while live Gemini calls can be much slower. `ml/p1_adapter.py` clips only the copy used for P0 scoring to the clean benchmark latency range; the stored P1 trace keeps the real API wall-clock latency.

## 5. Outputs

A run is written under:

```text
data/p1_runs/
```

The combined latest demo result is:

```text
data/p1_runs/latest_p1_result.json
```

It contains the original LLM run, diagnosis, replay result, fixed replay, trace diff, causal check, and unrelated-step control trial.

## 6. The actual P1 claim

Do not call the P1 result "real-world model accuracy". The fault is still controlled and injected by Black Box. The new part is that the **execution being diagnosed is produced by a real Gemini call**, and the replay suffix is executed again through Gemini.

The strongest demo sequence is:

1. Gemini produces a failed run.
2. Black Box ranks the suspicious checkpoint.
3. Black Box reuses the prefix and reruns only the suffix.
4. Repairing the suspected step flips the outcome.
5. Repairing an unrelated step does not.
6. The diff shows where the executions first diverged.

## P0 commands remain available

```powershell
python -m scripts.generate_data
python -m ml.train
python -m ml.diagnose
python -m ml.evaluate
```

Use module form (`python -m ...`) from the project root.
