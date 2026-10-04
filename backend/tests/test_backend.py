import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.storage import RunStorage
from backend.schemas import Run, Step, FaultInfo

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["runs_loaded"] >= 4


def test_storage_and_fault_masking(tmp_path):
    test_file = tmp_path / "test_runs.jsonl"
    storage = RunStorage(test_file)

    run = Run(
        id="test_001",
        template="price_compare",
        agent_kind="simulated",
        status="FAILED",
        outcome_summary="Bad calculation",
        created_at="2026-10-03T12:00:00Z",
        suspect_step=2,
        fault=FaultInfo(fault_type="numeric_overflow", injected_step=2),
        steps=[
            Step(
                step_idx=1,
                step_name="start",
                step_type="plan",
                writes=["x"],
            ),
            Step(
                step_idx=2,
                step_name="calc",
                step_type="llm_call",
                reads=["x"],
                writes=["y"],
                error_flag=True,
            ),
            Step(
                step_idx=3,
                step_name="final_answer",
                step_type="final_answer",
                reads=["y"],
            ),
        ],
    )
    storage.save_run(run)

    # 1. Fault hidden by default
    fetched_masked = storage.get_run("test_001", reveal=False)
    assert fetched_masked is not None
    assert fetched_masked.fault is None

    # 2. Fault revealed with reveal=True
    fetched_revealed = storage.get_run("test_001", reveal=True)
    assert fetched_revealed is not None
    assert fetched_revealed.fault is not None
    assert fetched_revealed.fault.fault_type == "numeric_overflow"

    # 3. Filtering
    assert len(storage.list_runs(status="FAILED")) == 1
    assert len(storage.list_runs(status="PASSED")) == 0
    assert len(storage.list_runs(template="price_compare")) == 1
    assert len(storage.list_runs(template="nonexistent")) == 0


def test_api_list_runs():
    response = client.get("/api/runs")
    assert response.status_code == 200
    runs = response.json()
    assert len(runs) >= 4
    # Ensure faults are masked by default
    for r in runs:
        assert r["fault"] is None


def test_api_list_runs_filtered():
    response = client.get("/api/runs?status=PASSED")
    assert response.status_code == 200
    runs = response.json()
    assert len(runs) >= 1
    for r in runs:
        assert r["status"] == "PASSED"


def test_api_get_run_reveal():
    # Hidden
    res_hidden = client.get("/api/runs/run_0142")
    assert res_hidden.status_code == 200
    assert res_hidden.json()["fault"] is None

    # Revealed
    res_revealed = client.get("/api/runs/run_0142?reveal=true")
    assert res_revealed.status_code == 200
    data = res_revealed.json()
    assert data["fault"] is not None
    assert data["fault"]["fault_type"] == "numeric_overflow"


def test_api_diagnose_and_causal_chain():
    response = client.post("/api/runs/run_0142/diagnose")
    assert response.status_code == 200
    diag = response.json()

    assert diag["run_id"] == "run_0142"
    assert diag["suspect_step"] == 3
    assert diag["relative_blame"] > 0
    assert "confidence" not in diag  # Frozen requirement: never name it confidence
    assert len(diag["blame_ranking"]) > 0
    assert len(diag["evidence"]) > 0

    # Causal chain verification
    chain = diag["causal_chain"]
    assert len(chain["nodes"]) >= 2
    assert chain["nodes"][0]["step_idx"] == 3
    # Chain terminates at final step
    assert chain["nodes"][-1]["step_type"] == "final_answer"


def test_api_eval():
    response = client.get("/api/eval")
    assert response.status_code == 200
    data = response.json()
    assert data["is_example"] is True
    assert len(data["overall_metrics"]) >= 5
    assert len(data["feature_importance"]) >= 5
    assert "seen_fault_types" in data["seen_vs_unseen"]


def test_api_demo_bundle():
    response = client.get("/api/demo/bundle")
    assert response.status_code == 200
    data = response.json()
    assert "runs" in data
    assert "diagnoses" in data
    assert len(data["runs"]) >= 4
    # Check that Top-3 catch trace run_0145 exists
    assert "run_0145" in data["diagnoses"]
