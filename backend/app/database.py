"""
Database module - Motor async MongoDB client and collection helpers.
"""
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

client: AsyncIOMotorClient = None


async def connect_db():
    """Create MongoDB connection on startup."""
    global client
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    # Verify connection
    await client.admin.command("ping")
    print(f"Connected to MongoDB: {settings.DB_NAME}")


async def close_db():
    """Close MongoDB connection on shutdown."""
    global client
    if client:
        client.close()
        print("MongoDB connection closed")


def get_db():
    """Return database instance."""
    return client[settings.DB_NAME]


# Collection shortcuts
def users_col():
    return get_db()["users"]


def properties_col():
    return get_db()["properties"]


def messages_col():
    return get_db()["messages"]


def favorites_col():
    return get_db()["favorites"]


def reviews_col():
    return get_db()["reviews"]


def notifications_col():
    return get_db()["notifications"]
