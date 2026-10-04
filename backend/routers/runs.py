from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Path
from backend.schemas import Run
from backend.storage import storage

router = APIRouter(prefix="/api/runs", tags=["runs"])


@router.get("", response_model=List[Run])
def list_runs(
    status: Optional[str] = Query(None, description="Filter by status (PASSED/FAILED)"),
    fault_type: Optional[str] = Query(None, description="Filter by fault type"),
    template: Optional[str] = Query(None, description="Filter by agent template"),
    agent_kind: Optional[str] = Query(None, description="Filter by agent kind"),
    reveal: bool = Query(False, description="Reveal hidden fault information"),
):
    """Retrieve all execution runs with optional filters."""
    return storage.list_runs(
        status=status,
        fault_type=fault_type,
        template=template,
        agent_kind=agent_kind,
        reveal=reveal,
    )


@router.get("/{id}", response_model=Run)
def get_run(
    id: str = Path(..., description="Run identifier"),
    reveal: bool = Query(False, description="Reveal hidden ground truth fault"),
):
    """Retrieve a single execution trace by ID."""
    run = storage.get_run(id, reveal=reveal)
    if not run:
        raise HTTPException(status_code=404, detail=f"Run '{id}' not found")
    return run


@router.post("", response_model=Run)
def create_or_save_run(run: Run):
    """Save or update an execution trace (used by agent execution or replay updates)."""
    storage.save_run(run)
    return run
