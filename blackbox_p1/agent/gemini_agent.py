from __future__ import annotations

import hashlib
import json
import time
import uuid
from copy import deepcopy
from typing import Any, Optional

from core.models import Fault, Lineage, Meta, Run, Step, Task
from core.tools import CANONICAL_REFUND_DOC, WRONG_REFUND_DOC, search_docs

from .gemini_client import GeminiClient


def canon(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def state_hash(value: Any) -> str:
    return hashlib.sha1(canon(value).encode("utf-8")).hexdigest()


def _step_metrics(step_type: str, elapsed_ms: float, prompt_len: int, output_len: int) -> tuple[int, int]:
    """Produce trace metrics that remain comparable to the P0 schema.

    latency_ms stores the real API wall-clock latency, which is useful for P1
    trace inspection. tokens is an estimate when the SDK does not expose a
    stable cross-version usage field.
    """
    latency = max(1, int(round(elapsed_ms)))
    if step_type in {"llm_call", "parse", "final_answer", "plan"}:
        estimated_tokens = max(1, round((prompt_len + output_len) / 4))
    else:
        estimated_tokens = 0
    return latency, int(estimated_tokens)


def make_step(
    idx: int,
    step_type: str,
    name: str,
    prompt: Optional[str],
    inp: Any,
    out: Any,
    before: dict[str, Any],
    after: dict[str, Any],
    reads: Optional[list[dict[str, Any]]] = None,
    writes: Optional[list[str]] = None,
    elapsed_ms: float = 0.0,
    error_flag: bool = False,
    error_msg: Optional[str] = None,
) -> Step:
    latency_ms, tokens = _step_metrics(
        step_type,
        elapsed_ms,
        len(prompt or ""),
        len(canon(out)),
    )
    return Step(
        step_idx=idx,
        type=step_type,
        name=name,
        prompt=prompt,
        input=deepcopy(inp),
        output=deepcopy(out),
        error_flag=error_flag,
        error_msg=error_msg,
        latency_ms=latency_ms,
        tokens=tokens,
        reads=reads or [],
        writes=writes or [],
        state_after=deepcopy(after),
        pre_state_hash=state_hash(before),
        cache_key=state_hash(
            {"type": step_type, "name": name, "input": inp, "pre_state": before}
        ),
    )


def build_p1_task(task_seed: int = 9001) -> Task:
    """Fixed demo task chosen so a wrong policy document flips the result."""
    return Task(
        template="policy_lookup",
        task_seed=task_seed,
        prompt=(
            "A customer purchased a laptop 10 days ago. "
            "Check the refund policy and decide whether they are eligible."
        ),
        expected_answer="Refund not eligible",
    )


def parse_json_text(text: str) -> dict[str, Any]:
    value = text.strip()
    if value.startswith("```"):
        lines = value.splitlines()
        if len(lines) >= 3:
            value = "\n".join(lines[1:-1]).strip()
    parsed = json.loads(value)
    if not isinstance(parsed, dict):
        raise ValueError("Gemini response must be a JSON object.")
    return parsed


class GeminiAgent:
    """Real Gemini execution with a fixed, traceable five-step workflow.

    Step layout intentionally matches the P0 policy_lookup shape so the same
    XGBoost feature extractor/model can be used for the first P1 experiment.
    """

    def __init__(self, client: GeminiClient) -> None:
        self.client = client

    def run(
        self,
        task: Task,
        fault: Optional[Fault] = None,
        *,
        lineage: Optional[Lineage] = None,
        reused_prefix: Optional[list[Step]] = None,
        initial_state: Optional[dict[str, Any]] = None,
        start_step: int = 0,
        patched_outputs: Optional[dict[int, Any]] = None,
        fault_enabled: bool = True,
        run_id_prefix: str = "llm",
    ) -> Run:
        task = task if isinstance(task, Task) else Task(**task)
        fault = fault or Fault()
        lineage = lineage or Lineage()
        patched_outputs = patched_outputs or {}

        
        steps = deepcopy(reused_prefix or [])
        state: dict[str, Any] = deepcopy(initial_state or {})
        call_latencies: list[float] = []

        # When a prefix is reused, restore its last checkpoint.
        # initial_state may contain an intentional replay patch, so merge it
        # over the checkpoint rather than discarding it.
        if steps:
            checkpoint_state = deepcopy(steps[-1].state_after)
            checkpoint_state.update(state)
            state = checkpoint_state


        if start_step <= 0 and len(steps) == 0:
            step0_prompt = f"""
You are the planning stage of an observable AI agent.
Task: {task.prompt}
Return JSON with exactly two fields: action and query.
The required action is search_docs and the query should ask for the 7-day refund policy.
Do not make the final decision here.
""".strip()
            started = time.perf_counter()
            out, raw = self.client.generate_json(step0_prompt)
            elapsed = (time.perf_counter() - started) * 1000
            state["next_action"] = out.get("action")
            state["query"] = out.get("query")
            steps.append(
                make_step(
                    0,
                    "plan",
                    "planner",
                    step0_prompt,
                    {"prompt": task.prompt},
                    out,
                    {},
                    state,
                    writes=["next_action", "query"],
                    elapsed_ms=elapsed,
                )
            )
            call_latencies.append(elapsed)

        if start_step <= 1 and len(steps) <= 1:
            query = "refund within 7 days"
            before = deepcopy(state)
            docs = search_docs(query)
            fault_applies = (
                fault_enabled
                and fault.injected
                and fault.step_idx == 1
                and fault.fault_type == "wrong_retrieval"
            )
            if fault_applies:
                docs = [dict(WRONG_REFUND_DOC)]
                source = "injected_wrong_retrieval"
            else:
                source = "canonical_retrieval"

            state["retrieved_docs"] = deepcopy(docs)
            out = {"query": query, "documents": deepcopy(docs), "source": source}
            out = deepcopy(patched_outputs.get(1, out))
            # A patched retrieval output also becomes the authoritative state.
            if isinstance(out, dict) and isinstance(out.get("documents"), list):
                state["retrieved_docs"] = deepcopy(out["documents"])

            steps.append(
                make_step(
                    1,
                    "retrieval",
                    "search_docs",
                    None,
                    {"query": query},
                    out,
                    before,
                    state,
                    reads=[{"step_idx": 0, "key": "query"}],
                    writes=["retrieved_docs"],
                    elapsed_ms=8.0,
                )
            )

        if start_step <= 2 and len(steps) <= 2:
            before = deepcopy(state)
            parse_prompt = f"""
Extract the refund duration from the retrieved policy text.
Customer task: {task.prompt}
Retrieved documents:
{json.dumps(state.get('retrieved_docs', []), ensure_ascii=False)}
Return JSON with exactly one field: days (integer).
Do not decide eligibility yet.
""".strip()
            started = time.perf_counter()
            out, raw = self.client.generate_json(parse_prompt)
            elapsed = (time.perf_counter() - started) * 1000

            out = deepcopy(patched_outputs.get(2, out))
            try:
                days = int(out["days"])
            except (KeyError, TypeError, ValueError) as exc:
                raise ValueError(
                    f"Parser response must contain integer days: {out}"
                ) from exc

            state["refund_days"] = days
            steps.append(
                make_step(
                    2,
                    "parse",
                    "parser",
                    parse_prompt,
                    {"documents": state.get("retrieved_docs", [])},
                    out,
                    before,
                    state,
                    reads=[{"step_idx": 1, "key": "retrieved_docs"}],
                    writes=["refund_days"],
                    elapsed_ms=elapsed,
                )
            )
            call_latencies.append(elapsed)

        if start_step <= 3 and len(steps) <= 3:
            before = deepcopy(state)
            reason_prompt = f"""
You are the decision stage of an AI agent.
Customer purchased the laptop 10 days ago.
Use ONLY refund_days from the state below as the policy limit.
State: {json.dumps(state, ensure_ascii=False)}
Return JSON with exactly two fields: refund_days and eligible.
eligible must be true only when 10 is less than or equal to refund_days.
""".strip()
            started = time.perf_counter()
            out, raw = self.client.generate_json(reason_prompt)
            elapsed = (time.perf_counter() - started) * 1000
            eligible = bool(out.get("eligible"))
            state["eligible"] = eligible
            out = deepcopy(patched_outputs.get(3, out))
            if "eligible" in out:
                state["eligible"] = bool(out["eligible"])
            steps.append(
                make_step(
                    3,
                    "llm_call",
                    "reasoner",
                    reason_prompt,
                    {"state": before},
                    out,
                    before,
                    state,
                    reads=[{"step_idx": 2, "key": "refund_days"}],
                    writes=["eligible"],
                    elapsed_ms=elapsed,
                )
            )
            call_latencies.append(elapsed)

        if start_step <= 4 and len(steps) <= 4:
            before = deepcopy(state)
            answer_prompt = f"""
Return the final answer for the customer.
Eligibility state: {json.dumps(state, ensure_ascii=False)}
Return JSON with exactly one field, answer.
Use exactly one of these strings:
- Refund eligible
- Refund not eligible
""".strip()
            started = time.perf_counter()
            out, raw = self.client.generate_json(answer_prompt)
            elapsed = (time.perf_counter() - started) * 1000
            answer = str(out.get("answer", "Unknown"))
            out = deepcopy(patched_outputs.get(4, out))
            answer = str(out.get("answer", answer))
            steps.append(
                make_step(
                    4,
                    "final_answer",
                    "answer",
                    answer_prompt,
                    {"state": before},
                    out,
                    before,
                    state,
                    reads=[{"step_idx": 3, "key": "eligible"}],
                    elapsed_ms=elapsed,
                )
            )
            call_latencies.append(elapsed)

        final_answer = _normalize_answer(steps[-1].output if steps else {})
        status = "success" if final_answer == task.expected_answer else "failed"

        if not steps or [s.step_idx for s in steps] != [0, 1, 2, 3, 4]:
            raise RuntimeError("P1 agent must produce exactly five steps [0..4].")

        model_name = getattr(self.client, "model", None)
        run_id = f"{run_id_prefix}_{uuid.uuid4().hex[:12]}"
        return Run(
            run_id=run_id,
            task=task,
            status=status,
            final_answer=final_answer,
            agent_kind="llm",
            steps=steps,
            fault=fault,
            lineage=lineage,
            meta=Meta(split="p1", is_decoy=False, model=model_name, temperature=None),
        )


def _normalize_answer(output: Any) -> str:
    if isinstance(output, dict):
        return str(output.get("answer", "Unknown"))
    return "Unknown"


def correct_retrieval_patch() -> dict[str, Any]:
    return {
        "query": "refund within 7 days",
        "documents": [dict(CANONICAL_REFUND_DOC)],
        "source": "replay_patch",
    }
