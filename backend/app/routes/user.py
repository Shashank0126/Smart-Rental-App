"""
User-facing routes: search, property detail, favorites, reviews, notifications.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from bson import ObjectId
from datetime import datetime
from typing import Optional
import asyncio

from app.database import properties_col, users_col, favorites_col, reviews_col, notifications_col
from app.middleware.auth import get_current_user, require_role
from app.models.schemas import FavoriteCreate, ReviewCreate

router = APIRouter(tags=["User"])


def serialize_property(p: dict) -> dict:
    p["id"] = str(p.pop("_id"))
    return p


@router.get("/properties")
async def search_properties(
    q: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    amenities: Optional[str] = Query(None),  # comma-separated
    page: int = Query(1, ge=1),
    limit: int = Query(12, le=50),
    sort: str = Query("newest"),  # newest, price_asc, price_desc, rating
):
    """Search and filter properties."""
    query: dict = {"isFlagged": {"$ne": True}}

    if q:
        query["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
            {"location.address": {"$regex": q, "$options": "i"}},
        ]
    if type:
        query["type"] = type
    if city:
        query["location.city"] = {"$regex": city, "$options": "i"}
    if min_price is not None or max_price is not None:
        price_filter = {}
        if min_price is not None:
            price_filter["$gte"] = min_price
        if max_price is not None:
            price_filter["$lte"] = max_price
        query["price"] = price_filter
    if amenities:
        ams = [a.strip() for a in amenities.split(",")]
        query["amenities"] = {"$all": ams}

    sort_map = {
        "newest": [("createdAt", -1)],
        "price_asc": [("price", 1)],
        "price_desc": [("price", -1)],
        "rating": [("avgRating", -1)],
    }
    sort_order = sort_map.get(sort, [("createdAt", -1)])

    skip = (page - 1) * limit
    cursor = properties_col().find(query).sort(sort_order).skip(skip).limit(limit)
    props = await cursor.to_list(limit)
    total = await properties_col().count_documents(query)

    return {
        "properties": [serialize_property(p) for p in props],
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit,
    }


@router.get("/properties/{property_id}")
async def get_property(property_id: str):
    """Get full property detail including reviews."""
    prop = await properties_col().find_one({"_id": ObjectId(property_id)})
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    # Fetch reviews
    reviews_cursor = reviews_col().find({"propertyId": property_id}).sort("createdAt", -1)
    reviews = await reviews_cursor.to_list(20)
    for r in reviews:
        r["id"] = str(r.pop("_id"))

    # Fetch owner info (non-sensitive)
    owner = await users_col().find_one(
        {"_id": ObjectId(prop["ownerId"])},
        {"name": 1, "phone": 1, "email": 1}
    )
    if owner:
        prop["ownerName"] = owner.get("name")
        prop["ownerPhone"] = owner.get("phone")

    result = serialize_property(prop)
    result["reviews"] = reviews
    return result


@router.post("/favorites")
async def add_favorite(body: FavoriteCreate, user: dict = Depends(get_current_user)):
    """Add a property to favorites."""
    # Check property exists
    if not await properties_col().find_one({"_id": ObjectId(body.propertyId)}):
        raise HTTPException(status_code=404, detail="Property not found")

    # Check if already favorited
    existing = await favorites_col().find_one({
        "userId": str(user["_id"]),
        "propertyId": body.propertyId
    })
    if existing:
        # Toggle off - remove from favorites
        await favorites_col().delete_one({
            "userId": str(user["_id"]),
            "propertyId": body.propertyId
        })
        return {"message": "Removed from favorites", "isFavorite": False}

    await favorites_col().insert_one({
        "userId": str(user["_id"]),
        "propertyId": body.propertyId,
        "createdAt": datetime.utcnow(),
    })
    return {"message": "Added to favorites", "isFavorite": True}


@router.get("/favorites")
async def get_favorites(user: dict = Depends(get_current_user)):
    """Get all favorited properties for the current user."""
    favs = await favorites_col().find({"userId": str(user["_id"])}).to_list(100)
    prop_ids = [ObjectId(f["propertyId"]) for f in favs if ObjectId.is_valid(f["propertyId"])]

    if not prop_ids:
        return []

    props = await properties_col().find({"_id": {"$in": prop_ids}}).to_list(100)
    return [serialize_property(p) for p in props]


@router.delete("/favorites/{property_id}")
async def remove_favorite(property_id: str, user: dict = Depends(get_current_user)):
    await favorites_col().delete_one({"userId": str(user["_id"]), "propertyId": property_id})
    return {"message": "Removed from favorites"}


@router.post("/reviews/{property_id}", status_code=201)
async def add_review(
    property_id: str,
    body: ReviewCreate,
    user: dict = Depends(require_role("user"))
):
    """Submit a review for a property."""
    prop = await properties_col().find_one({"_id": ObjectId(property_id)})
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    # Check if already reviewed
    existing = await reviews_col().find_one({
        "propertyId": property_id,
        "userId": str(user["_id"])
    })
    if existing:
        raise HTTPException(status_code=400, detail="You have already reviewed this property")

    review_doc = {
        "propertyId": property_id,
        "userId": str(user["_id"]),
        "userName": user["name"],
        "rating": body.rating,
        "comment": body.comment,
        "createdAt": datetime.utcnow(),
    }
    await reviews_col().insert_one(review_doc)

    # Update property average rating
    all_reviews = await reviews_col().find({"propertyId": property_id}).to_list(1000)
    avg = sum(r["rating"] for r in all_reviews) / len(all_reviews)
    await properties_col().update_one(
        {"_id": ObjectId(property_id)},
        {"$set": {"avgRating": round(avg, 1), "reviewCount": len(all_reviews)}}
    )

    return {"message": "Review submitted", "avgRating": round(avg, 1)}


@router.get("/notifications")
async def get_notifications(user: dict = Depends(get_current_user)):
    """Get user's notifications."""
    notes = await notifications_col().find(
        {"userId": str(user["_id"])}
    ).sort("createdAt", -1).limit(30).to_list(30)
    for n in notes:
        n["id"] = str(n.pop("_id"))
    return notes


@router.put("/notifications/{notif_id}/read")
async def mark_notification_read(notif_id: str, user: dict = Depends(get_current_user)):
    await notifications_col().update_one(
        {"_id": ObjectId(notif_id)},
        {"$set": {"isRead": True}}
    )
    return {"message": "Marked as read"}
