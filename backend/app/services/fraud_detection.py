"""
Fraud detection service.
- Detects duplicate listings (same owner, similar title + price)
- Flags unrealistic prices for the property type
"""
from app.database import properties_col
from difflib import SequenceMatcher

# Realistic price ranges per property type (monthly rent in INR)
PRICE_RANGES = {
    "1BHK":       (3_000,   80_000),
    "2BHK":       (5_000,  150_000),
    "3BHK":       (8_000,  250_000),
    "Commercial": (10_000, 500_000),
}


def is_unrealistic_price(property_type: str, price: float) -> bool:
    """Return True if price is outside the realistic range for this property type."""
    low, high = PRICE_RANGES.get(property_type, (1_000, 1_000_000))
    return price < low or price > high


async def check_duplicate(owner_id: str, title: str, price: float) -> bool:
    """Check if the owner already has a similar listing (title similarity > 80%)."""
    existing = await properties_col().find(
        {"ownerId": owner_id}
    ).to_list(100)

    for prop in existing:
        ratio = SequenceMatcher(None, title.lower(), prop["title"].lower()).ratio()
        if ratio > 0.8 and abs(prop["price"] - price) / max(prop["price"], 1) < 0.1:
            return True
    return False


async def run_fraud_checks(owner_id: str, title: str, price: float, property_type: str) -> dict:
    """Run all fraud checks and return results."""
    is_duplicate = await check_duplicate(owner_id, title, price)
    is_bad_price = is_unrealistic_price(property_type, price)

    return {
        "isDuplicate": is_duplicate,
        "isUnrealisticPrice": is_bad_price,
        "shouldFlag": is_duplicate or is_bad_price,
        "reasons": [
            *( ["Possible duplicate listing detected"] if is_duplicate else []),
            *( [f"Price ₹{price:,.0f} is outside normal range for {property_type}"] if is_bad_price else []),
        ]
    }
