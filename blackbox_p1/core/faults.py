FAULT_TYPES = ["wrong_retrieval", "corrupted_output"]

SCENARIO_FAULTS = {
    "flight_search": (1, "wrong_retrieval"),
    "damaged_order_replacement": (2, "wrong_retrieval"),
    "sales_growth": (3, "corrupted_output"),
}

def describe_fault(template):
    return {
        "flight_search": "The flight-search tool returns stale/incomplete options and omits the best qualifying nonstop flight.",
        "damaged_order_replacement": "The policy lookup returns an outdated 30-day replacement window instead of the current 7-day policy.",
        "sales_growth": "The calculation stage produces an incorrect percentage despite having the correct Q3 and Q4 values.",
    }[template]
