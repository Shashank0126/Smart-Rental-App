"""
FastAPI application entry point.
"""
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime
from passlib.context import CryptContext

from app.config import settings
from app.database import connect_db, close_db, users_col
from app.routes import auth, admin, owner, user, chat, ai
from app.middleware.auth import get_current_user

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Connect to DB
    await connect_db()

    # Seed admin account if not exists
    existing_admin = await users_col().find_one({"role": "admin"})
    if not existing_admin:
        await users_col().insert_one({
            "name": "Admin",
            "email": "admin@smartrental.com",
            "password": pwd_ctx.hash("Admin@123"),
            "role": "admin",
            "isApproved": "approved",
            "phone": None,
            "createdAt": datetime.utcnow(),
        })
        print("Default admin created: admin@smartrental.com / Admin@123")

    # Pre-train AI model
    from app.ai.rent_predictor import get_model
    get_model()
    print("AI models loaded")

    yield

    # Shutdown
    await close_db()


app = FastAPI(
    title="Smart Rental API",
    description="AI-Powered Rental Property Management System",
    version="1.0.0",
    lifespan=lifespan,
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(owner.router)
app.include_router(user.router)
app.include_router(chat.router)
app.include_router(ai.router)


# ─── Convenience endpoint ─────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {"message": "Smart Rental API is running", "version": "1.0.0"}


@app.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    user["id"] = str(user.pop("_id", user.get("id", "")))
    user.pop("password", None)
    return user
