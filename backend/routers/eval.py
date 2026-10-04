import json
from pathlib import Path
from fastapi import APIRouter, HTTPException
from backend.schemas import EvalResults

router = APIRouter(prefix="/api/eval", tags=["eval"])

_EVAL_FILE = Path(__file__).resolve().parent.parent.parent / "data" / "eval_results.json"


def validate_eval_data() -> EvalResults:
    """Validate eval_results.json against the EvalResults Pydantic schema."""
    if not _EVAL_FILE.exists():
        raise FileNotFoundError(f"Evaluation file not found at {_EVAL_FILE}")

    with open(_EVAL_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
        return EvalResults(**data)


@router.get("", response_model=EvalResults)
def get_eval_results():
    """Returns benchmark and baseline evaluation metrics."""
    try:
        return validate_eval_data()
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Evaluation results data file is invalid or missing: {str(e)}",
        )
