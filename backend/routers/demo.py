import json
from pathlib import Path
from typing import Any, Dict
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/demo", tags=["demo"])

_BUNDLE_FILE = Path(__file__).resolve().parent.parent.parent / "data" / "demo_bundle.json"


@router.get("/bundle", response_model=Dict[str, Any])
def get_demo_bundle():
    """Serves the precomputed demo bundle containing runs, diagnoses, and eval metrics."""
    if not _BUNDLE_FILE.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Demo bundle file not found at {_BUNDLE_FILE}",
        )
    try:
        with open(_BUNDLE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to read demo bundle: {str(e)}",
        )
