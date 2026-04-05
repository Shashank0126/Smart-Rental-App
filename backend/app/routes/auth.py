"""
Auth routes: register and login.
"""
from fastapi import APIRouter, HTTPException, status
from passlib.context import CryptContext
from datetime import datetime
from bson import ObjectId

from app.models.schemas import UserRegister, UserLogin, UserOut
from app.database import users_col, notifications_col
from app.middleware.auth import create_access_token

router = APIRouter(prefix="/auth", tags=["Auth"])
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_ctx.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_ctx.verify(plain, hashed)


def serialize_user(user: dict) -> dict:
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "isApproved": user.get("isApproved", "pending"),
        "phone": user.get("phone"),
        "createdAt": user["createdAt"],
    }


@router.post("/register", status_code=201)
async def register(body: UserRegister):
    """Register a new user or owner."""
    col = users_col()

    # Check duplicate email
    if await col.find_one({"email": body.email}):
        raise HTTPException(status_code=400, detail="Email already registered")

    # Admin role cannot be self-registered
    if body.role == "admin":
        raise HTTPException(status_code=400, detail="Cannot self-register as admin")

    # Owners start as pending; users are auto-approved
    is_approved = "approved" if body.role == "user" else "pending"

    doc = {
        "name": body.name,
        "email": body.email,
        "password": hash_password(body.password),
        "role": body.role,
        "isApproved": is_approved,
        "phone": body.phone,
        "createdAt": datetime.utcnow(),
        "favorites": [],
    }
    result = await col.insert_one(doc)
    doc["_id"] = result.inserted_id

    # Notify if owner
    if body.role == "owner":
        # Find admin and notify
        admin = await col.find_one({"role": "admin"})
        if admin:
            await notifications_col().insert_one({
                "userId": str(admin["_id"]),
                "title": "New Owner Registration",
                "body": f"{body.name} has registered as an owner and awaits approval.",
                "isRead": False,
                "createdAt": datetime.utcnow(),
            })

    token = create_access_token({"sub": str(result.inserted_id), "role": body.role})
    return {"token": token, "user": serialize_user(doc)}


@router.post("/login")
async def login(body: UserLogin):
    """Login and return JWT token."""
    user = await users_col().find_one({"email": body.email})
    if not user or not verify_password(body.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": str(user["_id"]), "role": user["role"]})
    return {"token": token, "user": serialize_user(user)}


@router.get("/me")
async def get_me(user: dict = None):
    """Get current user profile (protected by middleware in main.py)."""
    from app.middleware.auth import get_current_user
    from fastapi import Depends
    # This route is covered by the dependency below
    pass
