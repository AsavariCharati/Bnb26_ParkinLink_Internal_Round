PRICES = {"laptop_x_price": 80000, "laptop_y_price": 70000}

CANONICAL_REFUND_DOC = {
    "title": "Refund Policy",
    "text": "Refunds are available within 7 days of purchase subject to the applicable conditions.",
}

WRONG_REFUND_DOC = {
    "title": "Refund Policy",
    "text": "Refunds are available within 30 days of purchase subject to the applicable conditions.",
}

def lookup_db(key):
    return {"key": key, "value": PRICES.get(key)}

def search_docs(query):
    return [dict(CANONICAL_REFUND_DOC)]
