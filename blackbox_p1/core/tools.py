FLIGHT_OPTIONS = [
    {"id": "AI-204", "route": "Mumbai-Delhi", "price": 7600, "stops": 1},
    {"id": "AI-218", "route": "Mumbai-Delhi", "price": 7800, "stops": 0},
    {"id": "6E-611", "route": "Mumbai-Delhi", "price": 9200, "stops": 0},
]

ORDER = {"order_id": "#4821", "item": "wireless headphones", "delivered_days_ago": 10, "condition": "damaged"}
REPLACEMENT_POLICY = {"window_days": 7, "text": "Damaged items can be replaced within 7 days of delivery."}
WRONG_REPLACEMENT_POLICY = {"window_days": 30, "text": "Damaged items can be replaced within 30 days of delivery."}

SALES_REPORT = {"Q3_revenue": 120000, "Q4_revenue": 150000, "currency": "INR"}

def search_flights():
    return [dict(x) for x in FLIGHT_OPTIONS]

def lookup_order(order_id):
    return dict(ORDER) if order_id == ORDER["order_id"] else {"error": "order not found"}

def get_replacement_policy():
    return dict(REPLACEMENT_POLICY)

def get_wrong_replacement_policy():
    return dict(WRONG_REPLACEMENT_POLICY)

def load_sales_report():
    return dict(SALES_REPORT)
