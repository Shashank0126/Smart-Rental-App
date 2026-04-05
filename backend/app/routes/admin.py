"""
Admin routes: user management, approvals, property moderation, analytics.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from bson import ObjectId
from datetime import datetime

from app.database import users_col, properties_col, messages_col, notifications_col
from app.middleware.auth import require_role

router = APIRouter(prefix="/admin", tags=["Admin"])
admin_only = require_role("admin")


def obj(doc: dict) -> dict:
    """Add string id to mongo document."""
    doc["id"] = str(doc.pop("_id"))
    return doc


@router.get("/dashboard")
async def dashboard(user=Depends(admin_only)):
    """Return platform analytics."""
    ucol = users_col()
    pcol = properties_col()
    mcol = messages_col()

    total_users = await ucol.count_documents({"role": "user"})
    total_owners = await ucol.count_documents({"role": "owner"})
    total_properties = await pcol.count_documents({})
    pending = await ucol.count_documents({"role": "owner", "isApproved": "pending"})
    flagged = await pcol.count_documents({"isFlagged": True})
    total_messages = await mcol.count_documents({})

    # Monthly property registrations for chart
    pipeline = [
        {"$group": {
            "_id": {"month": {"$month": "$createdAt"}, "year": {"$year": "$createdAt"}},
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id.year": 1, "_id.month": 1}},
        {"$limit": 12}
    ]
    monthly = await properties_col().aggregate(pipeline).to_list(12)

    return {
        "totalUsers": total_users,
        "totalOwners": total_owners,
        "totalProperties": total_properties,
        "pendingApprovals": pending,
        "flaggedProperties": flagged,
        "totalMessages": total_messages,
        "monthlyListings": monthly,
    }


@router.get("/users")
async def list_users(
    role: str = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=100),
    user=Depends(admin_only)
):
    """List all users with optional role filter."""
    query = {}
    if role:
        query["role"] = role

    skip = (page - 1) * limit
    cursor = users_col().find(query, {"password": 0}).skip(skip).limit(limit).sort("createdAt", -1)
    users = await cursor.to_list(limit)
    total = await users_col().count_documents(query)

    return {
        "users": [obj(u) for u in users],
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }


@router.put("/approve-owner/{owner_id}")
async def approve_owner(owner_id: str, action: str = Query(..., regex="^(approved|rejected)$"), user=Depends(admin_only)):
    """Approve or reject an owner registration."""
    result = await users_col().update_one(
        {"_id": ObjectId(owner_id), "role": "owner"},
        {"$set": {"isApproved": action, "updatedAt": datetime.utcnow()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Owner not found")

    # Notify owner
    await notifications_col().insert_one({
        "userId": owner_id,
        "title": "Registration Update",
        "body": f"Your owner account has been {action} by admin.",
        "isRead": False,
        "createdAt": datetime.utcnow(),
    })
    return {"message": f"Owner {action} successfully"}


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, user=Depends(admin_only)):
    """Delete a user account."""
    res = await users_col().delete_one({"_id": ObjectId(user_id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted"}


@router.get("/properties")
async def list_all_properties(
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=100),
    flagged: bool = Query(None),
    user=Depends(admin_only)
):
    """List all properties with optional flag filter."""
    query = {}
    if flagged is not None:
        query["isFlagged"] = flagged

    skip = (page - 1) * limit
    cursor = properties_col().find(query).skip(skip).limit(limit).sort("createdAt", -1)
    props = await cursor.to_list(limit)
    total = await properties_col().count_documents(query)

    return {
        "properties": [obj(p) for p in props],
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }


@router.delete("/property/{property_id}")
async def delete_property(property_id: str, user=Depends(admin_only)):
    """Delete a property listing."""
    res = await properties_col().delete_one({"_id": ObjectId(property_id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Property not found")
    return {"message": "Property deleted"}


@router.put("/property/{property_id}/flag")
async def flag_property(property_id: str, flagged: bool = True, user=Depends(admin_only)):
    """Flag or unflag a suspicious property."""
    await properties_col().update_one(
        {"_id": ObjectId(property_id)},
        {"$set": {"isFlagged": flagged, "updatedAt": datetime.utcnow()}}
    )
    return {"message": f"Property {'flagged' if flagged else 'unflagged'}"}


@router.get("/notifications")
async def get_admin_notifications(user=Depends(admin_only)):
    """Get all admin notifications."""
    from app.database import notifications_col as ncol
    notes = await notifications_col().find(
        {"userId": str(user["_id"])}
    ).sort("createdAt", -1).limit(50).to_list(50)
    for n in notes:
        n["id"] = str(n.pop("_id"))
    return notes


@router.put("/notifications/read-all")
async def mark_all_read(user=Depends(admin_only)):
    await notifications_col().update_many(
        {"userId": str(user["_id"])},
        {"$set": {"isRead": True}}
    )
    return {"message": "All notifications marked as read"}
