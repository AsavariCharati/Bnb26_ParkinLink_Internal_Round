# Black Box P1

P1 connects a real Gemini agent to the Black Box diagnosis/replay pipeline. Each scenario represents a different real-world agent task and a different failure location.

## Setup

```bash
python -m venv venv
# Windows PowerShell
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Configure `.env`:

```env
GEMINI_API_KEY=YOUR_KEY
GEMINI_MODEL=gemini-3.5-flash-lite
P1_TEST=travel
```

## P0

```bash
python -m scripts.generate_data
python -m ml.train
python -m ml.evaluate
```

## P1 scenarios

For a faulty run, set `P1_TEST` and `P1_FAULT` to a supported pair.

For a healthy run with no injected issue, use:
```env
P1_TEST=travel
P1_FAULT=none
```
The healthy path should finish with `NO FAULT DETECTED` and skip replay/causal verification.

Then run:

```bash
python -m scripts.run_p1
```

Available scenarios:

- `refund` — refund-policy agent; wrong retrieval at Step 1
- `travel` — flight-search agent; stale search result at Step 1
- `support` — damaged-order replacement agent; outdated policy at Step 2
- `expense` — sales-analysis agent; corrupted calculation at Step 3

Every run is saved separately under `data/p1_runs/`; old results are not overwritten.

## Tests

```bash
pytest
```
