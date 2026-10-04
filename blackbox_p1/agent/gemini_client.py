from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import Any, Optional



@dataclass
class GeminiResponse:
    """Minimal normalized response used by the Black Box trace layer."""

    text: str
    raw: Any = None


class GeminiClient:
    """Thin wrapper around Google's current Gemini Python SDK."""

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None) -> None:
        key = api_key or os.getenv("GEMINI_API_KEY")
        if not key:
            raise RuntimeError(
                "GEMINI_API_KEY is not set. Put it in your environment or .env file."
            )

        self.model = model or os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
        try:
            from google import genai
        except ImportError as exc:
            raise RuntimeError(
                "google-genai is not installed. Run: pip install -r requirements.txt"
            ) from exc
        self.client = genai.Client(api_key=key)

    def generate(self, prompt: str) -> GeminiResponse:
        """Call Gemini and return plain text.

        We deliberately keep this stateless: every Black Box step is a separately
        recorded model call. This makes checkpoint replay explicit rather than
        hiding the execution inside a long-lived chat session.
        """
        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt,
        )
        text = getattr(response, "text", None)
        if not text:
            raise RuntimeError("Gemini returned an empty text response.")
        return GeminiResponse(text=text, raw=response)

    def generate_json(self, prompt: str) -> tuple[dict[str, Any], GeminiResponse]:
        """Ask Gemini for JSON and normalize object/list responses."""
        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt,
            config=_json_config(),
        )
        text = getattr(response, "text", None)
        if not text:
            raise RuntimeError("Gemini returned an empty JSON response.")

        value = _parse_json_object(text)
        return value, GeminiResponse(text=text, raw=response)


def _json_config():
    try:
        from google.genai import types
    except ImportError as exc:
        raise RuntimeError(
            "google-genai is not installed. Run: pip install -r requirements.txt"
        ) from exc
    return types.GenerateContentConfig(response_mime_type="application/json")


def _parse_json_object(text: str) -> dict[str, Any]:
    cleaned = text.strip()
    try:
        value = json.loads(cleaned)
    except json.JSONDecodeError:
        # Small fallback for models/providers that wrap JSON in a code fence.
        if cleaned.startswith("```"):
            lines = cleaned.splitlines()
            if len(lines) >= 3:
                cleaned = "\n".join(lines[1:-1]).strip()
        value = json.loads(cleaned)

    # Some valid Gemini responses naturally come back as a JSON array
    # (for example, a list of qualifying flights). Black Box traces use
    # object-shaped step outputs, so normalize arrays instead of crashing.
    if isinstance(value, list):
        return {"items": value}
    if not isinstance(value, dict):
        raise ValueError(f"Expected a JSON object or array, got {type(value).__name__}.")
    return value
