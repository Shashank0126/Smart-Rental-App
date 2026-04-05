"""
Cloudinary service - handles image uploads.
"""
import cloudinary
import cloudinary.uploader
from app.config import settings

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)


async def upload_image(file_bytes: bytes, folder: str = "smart-rental") -> str:
    """Upload image bytes to Cloudinary and return the secure URL."""
    result = cloudinary.uploader.upload(
        file_bytes,
        folder=folder,
        resource_type="image",
        transformation=[{"quality": "auto", "fetch_format": "auto"}],
    )
    return result["secure_url"]


async def delete_image(public_id: str) -> bool:
    """Delete an image from Cloudinary by public_id."""
    result = cloudinary.uploader.destroy(public_id)
    return result.get("result") == "ok"
