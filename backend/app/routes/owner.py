"""
Owner routes: property CRUD, inquiries management.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
import json

from app.database import properties_col, messages_col, users_col, notifications_col
from app.middleware.auth import require_approved_owner, get_current_user
from app.models.schemas import PropertyCreate, PropertyUpdate
from app.services.cloudinary_service import upload_image
from app.services.fraud_detection import run_fraud_checks

router = APIRouter(tags=["Owner"])


def serialize_property(p: dict) -> dict:
    p["id"] = str(p.pop("_id"))
    return p


@router.post("/properties", status_code=201)
async def create_property(
    title: str = Form(...),
    type: str = Form(...),
    price: float = Form(...),
    description: str = Form(...),
    amenities: str = Form("[]"),        # JSON array string
    location: str = Form(...),          # JSON object string
    size: Optional[float] = Form(None),
    images: List[UploadFile] = File(default=[]),
    user: dict = Depends(require_approved_owner()),
):
    """Create a new property listing with image uploads."""
    # Parse JSON fields
    try:
        location_data = json.loads(location)
        amenities_list = json.loads(amenities)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid location or amenities JSON")

    # Fraud checks
    fraud = await run_fraud_checks(str(user["_id"]), title, price, type)

    # Upload images to Cloudinary
    image_urls = []
    for img in images:
        if img.filename:
            content = await img.read()
            url = await upload_image(content, folder="smart-rental/properties")
            image_urls.append(url)

    doc = {
        "title": title,
        "type": type,
        "price": price,
        "location": location_data,
        "description": description,
        "amenities": amenities_list,
        "size": size,
        "images": image_urls,
        "ownerId": str(user["_id"]),
        "ownerName": user["name"],
        "isFlagged": fraud["shouldFlag"],
        "fraudReasons": fraud["reasons"],
        "avgRating": 0.0,
        "reviewCount": 0,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    }
    result = await properties_col().insert_one(doc)
    doc["id"] = str(result.inserted_id)

    return {"property": serialize_property(doc), "fraudWarnings": fraud["reasons"]}


@router.put("/properties/{property_id}")
async def update_property(
    property_id: str,
    title: Optional[str] = Form(None),
    type: Optional[str] = Form(None),
    price: Optional[float] = Form(None),
    description: Optional[str] = Form(None),
    amenities: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    size: Optional[float] = Form(None),
    new_images: List[UploadFile] = File(default=[]),
    user: dict = Depends(require_approved_owner()),
):
    """Update a property listing."""
    prop = await properties_col().find_one({"_id": ObjectId(property_id)})
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    if prop["ownerId"] != str(user["_id"]):
        raise HTTPException(status_code=403, detail="Not your property")

    updates = {"updatedAt": datetime.utcnow()}
    if title: updates["title"] = title
    if type: updates["type"] = type
    if price: updates["price"] = price
    if description: updates["description"] = description
    if amenities: updates["amenities"] = json.loads(amenities)
    if location: updates["location"] = json.loads(location)
    if size: updates["size"] = size

    # Upload new images
    new_urls = []
    for img in new_images:
        if img.filename:
            content = await img.read()
            url = await upload_image(content, folder="smart-rental/properties")
            new_urls.append(url)
    if new_urls:
        updates["$push"] = {"images": {"$each": new_urls}}

    await properties_col().update_one({"_id": ObjectId(property_id)}, {"$set": updates})
    updated = await properties_col().find_one({"_id": ObjectId(property_id)})
    return serialize_property(updated)


@router.delete("/properties/{property_id}")
async def delete_property(property_id: str, user: dict = Depends(require_approved_owner())):
    """Delete a property listing."""
    prop = await properties_col().find_one({"_id": ObjectId(property_id)})
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    if prop["ownerId"] != str(user["_id"]):
        raise HTTPException(status_code=403, detail="Not your property")

    await properties_col().delete_one({"_id": ObjectId(property_id)})
    return {"message": "Property deleted"}


@router.get("/owner/properties")
async def owner_properties(user: dict = Depends(require_approved_owner())):
    """Get all properties created by the current owner."""
    props = await properties_col().find(
        {"ownerId": str(user["_id"])}
    ).sort("createdAt", -1).to_list(100)
    return [serialize_property(p) for p in props]


@router.get("/owner/inquiries")
async def owner_inquiries(user: dict = Depends(require_approved_owner())):
    """Get all messages sent to this owner."""
    msgs = await messages_col().find(
        {"receiverId": str(user["_id"])}
    ).sort("timestamp", -1).to_list(100)

    # Enrich with sender info
    result = []
    for m in msgs:
        sender = await users_col().find_one({"_id": ObjectId(m["senderId"])})
        m["id"] = str(m.pop("_id"))
        m["senderName"] = sender["name"] if sender else "Unknown"
        result.append(m)

    return result


@router.get("/owner/stats")
async def owner_stats(user: dict = Depends(require_approved_owner())):
    """Get stats for owner dashboard."""
    owner_id = str(user["_id"])
    total_props = await properties_col().count_documents({"ownerId": owner_id})
    total_inquiries = await messages_col().count_documents({"receiverId": owner_id})
    unread = await messages_col().count_documents({"receiverId": owner_id, "isRead": False})
    flagged = await properties_col().count_documents({"ownerId": owner_id, "isFlagged": True})

    return {
        "totalProperties": total_props,
        "totalInquiries": total_inquiries,
        "unreadInquiries": unread,
        "flaggedProperties": flagged,
    }
