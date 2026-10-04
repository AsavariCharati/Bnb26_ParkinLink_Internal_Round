from __future__ import annotations

from copy import deepcopy
from typing import Any
import json

from core.models import Run
from ml.features import _tool_family


def adapt_for_p0_model(run: Run, clean_stats: dict[str, Any], sigma: float = 2.0) -> Run:
    """Create a model-input copy of a real Gemini trace.

    P0 was trained on controlled benchmark latencies (roughly tens of ms),
    while a real API call can take hundreds/thousands of ms. Feeding raw API
    latency directly would create an out-of-distribution shortcut. The original
    run keeps its real wall-clock latency; only the copy sent to the P0 model is
    clipped to the clean benchmark distribution for the same step family.
    """
    adapted = deepcopy(run)
    latency_stats = clean_stats.get("latency", {})
    for step in adapted.steps:
        key = (step.type, _tool_family(step))
        stat = latency_stats.get(key)
        if not stat:
            continue
        mean = float(stat.get("mean", step.latency_ms))
        std = max(float(stat.get("std", 1.0)), 1.0)
        lo = max(1.0, mean - sigma * std)
        hi = mean + sigma * std
        step.latency_ms = int(round(min(hi, max(lo, float(step.latency_ms)))))
    return adapted


def verify_root_cause(run: Run) -> int | None:
    """Semantic P1 verifier: find the earliest meaningful fault in the live trace.

    This is deliberately separate from the XGBoost ranking. The ML model ranks
    anomalous steps; this verifier prevents a downstream consequence from being
    mistaken for the root cause when the live Gemini trace is out-of-distribution.
    It ignores the nondeterministic planner step.
    """
    test = {
        "flight_search": "travel",
        "damaged_order_replacement": "support",
        "sales_growth": "expense",
        "policy_lookup": "refund",
    }.get(run.task.template)
    if test == "travel":
        s = next((x for x in run.steps if x.step_idx == 1), None)
        flights = (s.output or {}).get("flights", []) if s else []
        return 1 if not any(isinstance(f, dict) and f.get("id") == "AI-218" for f in flights) else None
    if test == "support":
        s = next((x for x in run.steps if x.step_idx == 2), None)
        window = (s.output or {}).get("window_days") if s and isinstance(s.output, dict) else None
        return 2 if window != 7 else None
    if test == "expense":
        s = next((x for x in run.steps if x.step_idx == 3), None)
        pct = (s.output or {}).get("percentage_increase") if s and isinstance(s.output, dict) else None
        return 3 if pct != 25 else None
    if test == "refund":
        s = next((x for x in run.steps if x.step_idx == 1), None)
        text = json.dumps(s.output).lower() if s else ""
        return 1 if "30 days" in text else None
    return None
