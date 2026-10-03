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
        elif "decision stage" in lower:
            import re
            match = re.search(r'"refund_days"\s*:\s*(\d+)', prompt)
            days = int(match.group(1)) if match else 7
            out = {"refund_days": days, "eligible": 10 <= days}
        elif "final answer" in lower:
            eligible = '"eligible": true' in lower
            out = {"answer": "Refund eligible" if eligible else "Refund not eligible"}
        else:
            raise AssertionError(f"Unexpected mock prompt: {prompt}")
        return out, MockResponse(text=json.dumps(out))

    def generate(self, prompt: str) -> MockResponse:
        return self.generate_json(prompt)[1]
