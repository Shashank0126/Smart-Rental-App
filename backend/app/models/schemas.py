"""
Pydantic models (schemas) for all collections.
"""
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from enum import Enum
from datetime import datetime


# ─── Enums ────────────────────────────────────────────────────────────────────

class UserRole(str, Enum):
    admin = "admin"
    owner = "owner"
    user = "user"


class PropertyType(str, Enum):
    one_bhk = "1BHK"
    two_bhk = "2BHK"
    three_bhk = "3BHK"
    commercial = "Commercial"


class ApprovalStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


# ─── User Models ──────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.user
    phone: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: UserRole
    isApproved: ApprovalStatus
    phone: Optional[str] = None
    createdAt: datetime


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None


# ─── Location Model ───────────────────────────────────────────────────────────

class Location(BaseModel):
    address: str
    lat: float
    lng: float
    city: Optional[str] = None
    state: Optional[str] = None


# ─── Property Models ──────────────────────────────────────────────────────────

class PropertyCreate(BaseModel):
    title: str
    type: PropertyType
    price: float
    location: Location
    description: str
    amenities: List[str] = []
    size: Optional[float] = None  # sq ft, used for rent prediction


class PropertyUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[PropertyType] = None
    price: Optional[float] = None
    location: Optional[Location] = None
    description: Optional[str] = None
    amenities: Optional[List[str]] = None
    size: Optional[float] = None


class PropertyOut(BaseModel):
    id: str
    title: str
    type: PropertyType
    price: float
    location: Location
    description: str
    amenities: List[str]
    images: List[str]
    ownerId: str
    ownerName: Optional[str] = None
    ownerPhone: Optional[str] = None
    isFlagged: bool = False
    avgRating: float = 0.0
    reviewCount: int = 0
    createdAt: datetime


# ─── Message Models ───────────────────────────────────────────────────────────

class MessageCreate(BaseModel):
    receiverId: str
    propertyId: Optional[str] = None
    message: str


class MessageOut(BaseModel):
    id: str
    senderId: str
    senderName: str
    receiverId: str
    propertyId: Optional[str] = None
    message: str
    timestamp: datetime
    isRead: bool = False


# ─── Favorite Models ──────────────────────────────────────────────────────────

class FavoriteCreate(BaseModel):
    propertyId: str


# ─── Review Models ────────────────────────────────────────────────────────────

class ReviewCreate(BaseModel):
    rating: int
    comment: str

    @field_validator("rating")
    @classmethod
    def rating_range(cls, v):
        if not 1 <= v <= 5:
            raise ValueError("Rating must be between 1 and 5")
        return v


class ReviewOut(BaseModel):
    id: str
    propertyId: str
    userId: str
    userName: str
    rating: int
    comment: str
    createdAt: datetime


# ─── Notification Models ──────────────────────────────────────────────────────

class NotificationOut(BaseModel):
    id: str
    userId: str
    title: str
    body: str
    isRead: bool = False
    createdAt: datetime


# ─── AI Models ────────────────────────────────────────────────────────────────

class RentPredictRequest(BaseModel):
    property_type: PropertyType
    size: float           # sq ft
    location_city: str
    amenities_count: int = 0


class RentPredictResponse(BaseModel):
    predicted_rent: float
    confidence: str
    range_low: float
    range_high: float


# ─── Admin Models ─────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    totalUsers: int
    totalOwners: int
    totalProperties: int
    pendingApprovals: int
    flaggedProperties: int
    totalMessages: int
