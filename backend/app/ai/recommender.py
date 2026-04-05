"""
Recommendation engine: content-based filtering.
Recommends properties similar to user's viewed/favorited listings.
"""
from app.database import properties_col, favorites_col
from bson import ObjectId
from typing import List


async def get_recommendations(user_id: str, limit: int = 6) -> List[dict]:
    """
    Content-based recommendation:
    1. Find user's favorited property types & locations
    2. Return similar properties not yet favorited
    """
    # Get user favorites
    favs = await favorites_col().find({"userId": user_id}).to_list(50)
    fav_ids = [f["propertyId"] for f in favs]

    if not fav_ids:
        # Cold start: return newest properties
        props = await properties_col().find(
            {"isFlagged": {"$ne": True}}
        ).sort("createdAt", -1).limit(limit).to_list(limit)
        return [_serialize(p) for p in props]

    # Get favorited property details
    fav_props = await properties_col().find(
        {"_id": {"$in": [ObjectId(i) for i in fav_ids if ObjectId.is_valid(i)]}}
    ).to_list(50)

    # Extract preferred types and cities
    preferred_types = list(set(p.get("type") for p in fav_props))
    preferred_cities = list(set(
        p.get("location", {}).get("city", "").lower()
        for p in fav_props
        if p.get("location", {}).get("city")
    ))

    # Average price range
    prices = [p["price"] for p in fav_props if p.get("price")]
    avg_price = sum(prices) / len(prices) if prices else 20000
    price_low = avg_price * 0.6
    price_high = avg_price * 1.4

    # Build recommendation query
    query = {
        "_id": {"$nin": [ObjectId(i) for i in fav_ids if ObjectId.is_valid(i)]},
        "isFlagged": {"$ne": True},
        "price": {"$gte": price_low, "$lte": price_high},
    }

    if preferred_types:
        query["type"] = {"$in": preferred_types}

    props = await properties_col().find(query).limit(limit * 2).to_list(limit * 2)

    # Score by city match
    def score(p):
        city = p.get("location", {}).get("city", "").lower()
        return 1 if city in preferred_cities else 0

    props.sort(key=score, reverse=True)
    return [_serialize(p) for p in props[:limit]]


def _serialize(p: dict) -> dict:
    p["id"] = str(p.pop("_id"))
    return p
