from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any


@dataclass
class MockResponse:
    text: str
    raw: Any = None


class MockGeminiClient:
    """Deterministic local replacement used only for P1 plumbing tests."""

    model = "mock-gemini"

    def generate_json(self, prompt: str) -> tuple[dict[str, Any], MockResponse]:
        lower = prompt.lower()
        if "planning stage" in lower:
            out = {"action": "search_docs", "query": "refund within 7 days"}
        elif "extract the refund duration" in lower:
            days = 30 if '"text": "Refunds are available within 30 days' in prompt else 7
            out = {"days": days}
        elif "use refund_days" in lower or "decision stage" in lower:
            import re
            match = re.search(r'"refund_days"\s*:\s*(\d+)', prompt)
            days = int(match.group(1)) if match else 7
            out = {"refund_days": days, "eligible": 10 <= days}
        elif "choose the best flight" in lower:
            out = {"flight_id": "AI-218", "price": 7800, "reason": "nonstop and under budget"}
        elif "inspect these flight options" in lower:
            out = {"options": [{"id": "AI-218", "price": 7800, "stops": 0}]}
        elif "retrieve the current replacement policy" in lower:
            out = {"window_days": 7, "text": "Damaged items can be replaced within 7 days of delivery."}
        elif "extract q3 and q4 revenue" in lower:
            out = {"Q3_revenue": 120000, "Q4_revenue": 150000}
        elif "final answer" in lower:
            eligible = '"eligible": true' in lower
            if "flight_id" in lower:
                out = {"answer": "AI-218"}
            elif "percentage_increase" in lower:
                out = {"answer": "25%"}
            else:
                out = {"answer": "Refund eligible" if eligible else "Refund not eligible"}
        else:
            raise AssertionError(f"Unexpected mock prompt: {prompt}")
        return out, MockResponse(text=json.dumps(out))

    def generate(self, prompt: str) -> MockResponse:
        return self.generate_json(prompt)[1]
