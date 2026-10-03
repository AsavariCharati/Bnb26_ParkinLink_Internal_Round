# Black Box

Black Box is an AI-agent debugging system that records agent execution traces, identifies the step most likely responsible for a failure using XGBoost, and verifies the diagnosis through checkpoint replay and causal validation.

## P0 — Controlled Benchmark

P0 uses a deterministic agent with injected faults to train and evaluate the XGBoost diagnosis model.

### Setup

```bash
python -m venv venv
```

Activate the virtual environment.

**Windows PowerShell:**
```powershell
.\venv\Scripts\Activate.ps1
```

**Windows CMD:**
```cmd
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

### Generate Dataset

```bash
python -m scripts.generate_data
```

### Train XGBoost

```bash
python -m ml.train
```

### Evaluate

```bash
python -m ml.evaluate
```

### Diagnose a Run

```bash
python -m ml.diagnose
```

---

## P1 — Real Gemini Agent

P1 connects the Black Box pipeline to a real Gemini-powered agent.

Flow:

```text
Gemini Agent
     ↓
Execution Trace
     ↓
XGBoost Diagnosis
     ↓
Suspect Step
     ↓
Checkpoint Replay
     ↓
Repair
     ↓
Trace Diff
     ↓
Causal Validation
```

### Configure Gemini

Create `.env` from `.env.example` and add:

```env
GEMINI_API_KEY=YOUR_API_KEY
GEMINI_MODEL=gemini-3.5-flash-lite
```

### Check P1 Setup

```bash
python -m scripts.check_p1
```

### Run P1

```bash
python -m scripts.run_p1
```

The P1 demo shows a real Gemini failure being diagnosed by XGBoost, replayed from the suspected checkpoint, repaired, and verified through a failed → success outcome.

---

## Tests

```bash
pytest
```

## Main Commands

```bash
# Setup
python -m venv venv
pip install -r requirements.txt

# P0
python -m scripts.generate_data
python -m ml.train
python -m ml.evaluate
python -m ml.diagnose

# P1
python -m scripts.check_p1
python -m scripts.run_p1

# Tests
pytest
```

> Run all commands from the project root with the virtual environment activated.
