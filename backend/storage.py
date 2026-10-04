import json
from pathlib import Path
from typing import Dict, List, Optional
from backend.schemas import Run, FaultInfo


class RunStorage:
    def __init__(self, data_path: Optional[Path] = None):
        if data_path is None:
            # Default to data/runs.jsonl relative to project root
            base_dir = Path(__file__).resolve().parent.parent
            data_path = base_dir / "data" / "runs.jsonl"
        self.data_path = data_path
        self._runs: Dict[str, Run] = {}
        self._faults: Dict[str, Optional[FaultInfo]] = {}
        self.load()

    def load(self) -> None:
        """Load runs from JSONL file into in-memory structures."""
        self._runs.clear()
        self._faults.clear()
        if not self.data_path.exists():
            self.data_path.parent.mkdir(parents=True, exist_ok=True)
            self.data_path.touch()
            return

        with open(self.data_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    data = json.loads(line)
                    run = Run(**data)
                    self._runs[run.id] = run
                    # Preserve original fault separately for masking/revealing
                    self._faults[run.id] = run.fault
                except Exception as e:
                    print(f"Warning: Failed to parse line in {self.data_path}: {e}")

    def save_run(self, run: Run) -> None:
        """Add or update a run and persist back to file."""
        self._runs[run.id] = run
        self._faults[run.id] = run.fault
        self._persist_all()

    def _persist_all(self) -> None:
        """Rewrite the JSONL file with all in-memory runs."""
        self.data_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.data_path, "w", encoding="utf-8") as f:
            for run_id, run in self._runs.items():
                run_dict = run.model_dump()
                # Restore fault in persisted storage
                if self._faults.get(run_id):
                    run_dict["fault"] = self._faults[run_id].model_dump()
                f.write(json.dumps(run_dict) + "\n")

    def get_run(self, run_id: str, reveal: bool = False) -> Optional[Run]:
        """Fetch a single run by id, masking fault by default unless reveal=True."""
        run = self._runs.get(run_id)
        if not run:
            return None
        run_copy = run.model_copy(deep=True)
        if reveal:
            run_copy.fault = self._faults.get(run_id)
        else:
            run_copy.fault = None
        return run_copy

    def list_runs(
        self,
        status: Optional[str] = None,
        fault_type: Optional[str] = None,
        template: Optional[str] = None,
        agent_kind: Optional[str] = None,
        reveal: bool = False,
    ) -> List[Run]:
        """Query runs with optional filters."""
        results: List[Run] = []
        for run_id, run in self._runs.items():
            if status and run.status.upper() != status.upper():
                continue
            if template and run.template.lower() != template.lower():
                continue
            if agent_kind and run.agent_kind.lower() != agent_kind.lower():
                continue
            if fault_type:
                fault = self._faults.get(run_id)
                if not fault or fault.fault_type.lower() != fault_type.lower():
                    continue

            run_copy = run.model_copy(deep=True)
            if reveal:
                run_copy.fault = self._faults.get(run_id)
            else:
                run_copy.fault = None
            results.append(run_copy)

        return results


# Global singleton storage instance
storage = RunStorage()
