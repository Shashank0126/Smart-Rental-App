"""
WebSocket chat handler and REST message routes.
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from bson import ObjectId
from datetime import datetime
from typing import Dict, List
import json
import asyncio

from app.database import messages_col, users_col, notifications_col, properties_col
from app.middleware.auth import decode_token, get_current_user
from app.models.schemas import MessageCreate

router = APIRouter(tags=["Chat"])

# Active WebSocket connections: {user_id: WebSocket}
active_connections: Dict[str, WebSocket] = {}


class ConnectionManager:
    def __init__(self):
        self.connections: Dict[str, WebSocket] = {}

    async def connect(self, user_id: str, ws: WebSocket):
        await ws.accept()
        self.connections[user_id] = ws

    def disconnect(self, user_id: str):
        self.connections.pop(user_id, None)

    async def send_personal(self, user_id: str, data: dict):
        ws = self.connections.get(user_id)
        if ws:
            try:
                await ws.send_json(data)
            except Exception:
                self.disconnect(user_id)

    async def broadcast(self, data: dict):
        for ws in self.connections.values():
            try:
                await ws.send_json(data)
            except Exception:
                pass


manager = ConnectionManager()


@router.websocket("/ws/chat/{token}")
async def websocket_chat(websocket: WebSocket, token: str):
    """
    WebSocket endpoint for real-time chat.
    Client must send token as path param for auth.
    Message format: {"receiverId": "...", "propertyId": "...", "message": "..."}
    """
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            await websocket.close(code=4001)
            return
    except Exception:
        await websocket.close(code=4001)
        return

    await manager.connect(user_id, websocket)
    user = await users_col().find_one({"_id": ObjectId(user_id)})
    sender_name = user["name"] if user else "Unknown"

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                await websocket.send_json({"error": "Invalid JSON"})
                continue

            receiver_id = data.get("receiverId")
            property_id = data.get("propertyId")
            message = data.get("message", "").strip()

            if not receiver_id or not message:
                await websocket.send_json({"error": "receiverId and message required"})
                continue

            # Save to DB
            doc = {
                "senderId": user_id,
                "senderName": sender_name,
                "receiverId": receiver_id,
                "propertyId": property_id,
                "message": message,
                "timestamp": datetime.utcnow(),
                "isRead": False,
            }
            result = await messages_col().insert_one(doc)
            doc["id"] = str(result.inserted_id)
            doc["timestamp"] = doc["timestamp"].isoformat()

            # Send to receiver if online
            await manager.send_personal(receiver_id, {**doc, "type": "new_message"})
            # Echo back to sender
            await manager.send_personal(user_id, {**doc, "type": "sent"})

            # In-app notification for receiver
            await notifications_col().insert_one({
                "userId": receiver_id,
                "title": f"New message from {sender_name}",
                "body": message[:80],
                "isRead": False,
                "createdAt": datetime.utcnow(),
            })

    except WebSocketDisconnect:
        manager.disconnect(user_id)


# ─── REST Fallback ────────────────────────────────────────────────────────────

@router.post("/messages")
async def send_message(body: MessageCreate, user: dict = Depends(get_current_user)):
    """REST fallback for sending a message."""
    receiver = await users_col().find_one({"_id": ObjectId(body.receiverId)})
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found")

    doc = {
        "senderId": str(user["_id"]),
        "senderName": user["name"],
        "receiverId": body.receiverId,
        "propertyId": body.propertyId,
        "message": body.message,
        "timestamp": datetime.utcnow(),
        "isRead": False,
    }
    result = await messages_col().insert_one(doc)
    doc["id"] = str(result.inserted_id)

    # Push notification to receiver via WS if online
    doc_json = {**doc, "timestamp": doc["timestamp"].isoformat()}
    await manager.send_personal(body.receiverId, {**doc_json, "type": "new_message"})

    # In-app notification
    await notifications_col().insert_one({
        "userId": body.receiverId,
        "title": f"New message from {user['name']}",
        "body": body.message[:80],
        "isRead": False,
        "createdAt": datetime.utcnow(),
    })

    return doc_json


@router.get("/messages/conversation/{other_user_id}")
async def get_conversation(
    other_user_id: str,
    property_id: str = None,
    user: dict = Depends(get_current_user)
):
    """Get conversation between current user and another user."""
    my_id = str(user["_id"])
    query = {
        "$or": [
            {"senderId": my_id, "receiverId": other_user_id},
            {"senderId": other_user_id, "receiverId": my_id},
        ]
    }
    if property_id:
        query["propertyId"] = property_id

    msgs = await messages_col().find(query).sort("timestamp", 1).to_list(200)

    # Mark as read
    await messages_col().update_many(
        {"senderId": other_user_id, "receiverId": my_id, "isRead": False},
        {"$set": {"isRead": True}}
    )

    for m in msgs:
        m["id"] = str(m.pop("_id"))
        if isinstance(m.get("timestamp"), datetime):
            m["timestamp"] = m["timestamp"].isoformat()
    return msgs


@router.get("/messages/threads")
async def get_message_threads(user: dict = Depends(get_current_user)):
    """Get unique conversation threads for the current user."""
    my_id = str(user["_id"])
    pipeline = [
        {
            "$match": {
                "$or": [{"senderId": my_id}, {"receiverId": my_id}]
            }
        },
        {"$sort": {"timestamp": -1}},
        {
            "$group": {
                "_id": {
                    "$cond": [
                        {"$eq": ["$senderId", my_id]},
                        "$receiverId",
                        "$senderId"
                    ]
                },
                "lastMessage": {"$first": "$message"},
                "lastTimestamp": {"$first": "$timestamp"},
                "unread": {
                    "$sum": {
                        "$cond": [
                            {"$and": [
                                {"$eq": ["$receiverId", my_id]},
                                {"$eq": ["$isRead", False]}
                            ]},
                            1, 0
                        ]
                    }
                }
            }
        }
    ]
    threads = await messages_col().aggregate(pipeline).to_list(50)

    # Enrich with user info
    result = []
    for t in threads:
        other_id = t["_id"]
        other = await users_col().find_one(
            {"_id": ObjectId(other_id)}, {"name": 1, "role": 1}
        )
        result.append({
            "userId": other_id,
            "userName": other["name"] if other else "Unknown",
            "userRole": other["role"] if other else "user",
            "lastMessage": t["lastMessage"],
            "lastTimestamp": t["lastTimestamp"].isoformat() if isinstance(t["lastTimestamp"], datetime) else t["lastTimestamp"],
            "unread": t["unread"],
        })

    return result
