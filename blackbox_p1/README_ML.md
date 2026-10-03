# Black Box ML — P0 preserved + P1 Gemini bridge

The original P0 ML build is preserved in this directory. P1 adds a real Gemini-backed agent, checkpoint replay, trace diff, and causal verification.

## P0

```powershell
pip install -r requirements.txt
python -m scripts.generate_data
python -m ml.train
python -m ml.diagnose
python -m ml.evaluate
```

## P1

```powershell
copy .env.example .env
# put GEMINI_API_KEY in .env

# offline plumbing test first
python -m scripts.run_p1 --mock

# then real Gemini
python -m scripts.run_p1
```

Use module form (`python -m ...`) from the project root so sibling packages such as `core`, `ml`, `agent`, and `replay` are importable.
