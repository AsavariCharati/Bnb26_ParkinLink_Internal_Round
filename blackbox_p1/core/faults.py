from .models import Fault

FAULT_TYPES = ["wrong_tool", "bad_argument", "corrupted_output", "wrong_retrieval", "misread_output"]

ELIGIBLE = {
    "price_compare_gst": {
        "wrong_tool": [1, 2],
        "bad_argument": [1, 2],
        "corrupted_output": [3, 4],
        "misread_output": [3, 4],
    },
    "policy_lookup": {
        "bad_argument": [1],
        "wrong_retrieval": [1],
        "corrupted_output": [3, 4],
        "misread_output": [3, 4],
    },
}

DESCRIPTIONS = {
    "wrong_tool": "The agent used the wrong tool for a required lookup.",
    "bad_argument": "The correct tool was called with an incorrect argument.",
    "corrupted_output": "A downstream model output was corrupted.",
    "wrong_retrieval": "The retrieval step returned a plausible but incorrect document.",
    "misread_output": "The agent misread a previous result.",
}

def make_fault(template, fault_type, seed):
    positions = ELIGIBLE[template][fault_type]
    return Fault(
        injected=True,
        step_idx=positions[seed % len(positions)],
        fault_type=fault_type,
        description=DESCRIPTIONS[fault_type],
    )

def supported_faults(template=None):
    return list(ELIGIBLE.get(template, {})) if template else FAULT_TYPES.copy()
