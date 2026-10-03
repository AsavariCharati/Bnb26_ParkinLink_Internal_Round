from __future__ import annotations
import re
from typing import Any, Dict

def _extract(prompt: str, key: str, default: str = "") -> str:
    m = re.search(rf"{re.escape(key)}\s*=\s*([^\n]+)", prompt)
    return m.group(1).strip() if m else default

def sim_llm(name: str, prompt: str, state: Dict[str, Any]) -> Dict[str, Any]:
    if name == "planner":
        if "price_compare_gst" in prompt:
            stage = _extract(prompt, "stage", "x")
            if stage == "x":
                return {"action": "lookup_db", "key": "laptop_x_price", "stage": stage}
            if stage == "y":
                return {"action": "lookup_db", "key": "laptop_y_price", "stage": stage}
            return {"action": "reason", "stage": stage}
        if "policy_lookup" in prompt:
            return {"action": "search_docs", "query": "refund within 7 days"}
        return {"action": "reason"}

    if name == "reasoner":
        if "laptop_x_price" in state or "laptop_y_price" in state:
            x, y = state.get("laptop_x_price"), state.get("laptop_y_price")
            if isinstance(x, (int, float)) and isinstance(y, (int, float)):
                cheaper = "X" if x < y else "Y" if y < x else "tie"
                return {"cheaper": cheaper, "x_price": x, "y_price": y}
            return {"cheaper": "unknown"}

        if "refund_days" in state:
            days = state.get("refund_days")
            return {"refund_days": days, "eligible": days == 7}

        return {"result": "unknown"}

    if name == "answer":
        if "cheaper" in state:
            c = state["cheaper"]
            return {"answer": f"Laptop {c}" if c in {"X", "Y"} else "Tie"}
        if "eligible" in state:
            return {"answer": "Refund eligible" if state["eligible"] else "Refund not eligible"}
        return {"answer": "Unknown"}

    if name == "parser":
        docs = state.get("retrieved_docs", [])
        text = docs[0].get("text", "") if docs else ""
        m = re.search(r"(\d+)\s*days?", text.lower())
        return {"days": int(m.group(1)) if m else None}

    return {"action": "noop"}
