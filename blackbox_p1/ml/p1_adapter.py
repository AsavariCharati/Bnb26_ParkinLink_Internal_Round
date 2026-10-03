from __future__ import annotations

from copy import deepcopy
from typing import Any

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
