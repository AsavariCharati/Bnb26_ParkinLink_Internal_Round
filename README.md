# Black Box — Developer Observability for AI Agents

Black Box is an observability and diagnostic tool for isolating, understanding, and repairing execution failures in AI agent traces.

## Architecture & Team Ownership

- **Person A (Agent, Data, ML)**: Agent harnesses, synthetic fault generators, diagnostic model.
- **Person B (Replay & Proof)**: Checkpoint replay engine, outcome proof verifier, trace diff.
- **Person C (Explore & Diagnose — Manasvi)**: Explorer UI, Timeline trace inspector, Evidence & Causal BFS graph, Evaluation report, and FastAPI backend skeleton.

---

## Quick Start

### 1. Backend API (FastAPI)

```bash
# Start FastAPI backend
python -m uvicorn backend.main:app --reload --port 8000
```

Run test suite:
```bash
python -m pytest
```

### 2. Frontend (Vite + React + TypeScript + Tailwind)

```bash
cd frontend
npm install
npm run dev
```

### 3. Running Modes

The frontend supports 3 modes switchable dynamically in the UI sidebar or via `.env`:

1. **`live`**: Connects to the local FastAPI backend (`http://localhost:8000/api`).
2. **`demo`**: Runs 100% offline from `data/demo_bundle.json` with precomputed traces, Top-3 catch cases, and diagnoses.
3. **`mock`**: Runs in-memory with contract samples for rapid UI development.

---

## Frozen API Contracts

- `GET /api/runs?status=&fault_type=&template=&agent_kind=&reveal=`
- `GET /api/runs/{id}?reveal=true`
- `POST /api/runs/{id}/diagnose`
- `GET /api/eval`
- `GET /api/demo/bundle`
