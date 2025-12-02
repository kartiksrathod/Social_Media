import cloudinary
import cloudinary.uploader
from fastapi import HTTPException, status
from typing import Dict, Any
import os

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME"),
    api_key=os.environ.get("CLOUDINARY_API_KEY"),
    api_secret=os.environ.get("CLOUDINARY_API_SECRET"),
    secure=True
)

class CloudinaryService:
    @staticmethod
    async def upload_image(file_data: bytes, folder: str = "uploads") -> Dict[str, Any]:
        """Upload an image to Cloudinary."""
        try:
            result = cloudinary.uploader.upload(
                file_data,
                folder=folder,
                resource_type="image",
                secure=True
            )
            return {
                "public_id": result.get("public_id"),
                "url": result.get("secure_url"),
                "width": result.get("width"),
                "height": result.get("height"),
                "format": result.get("format")
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Image upload failed: {str(e)}"
            )
    
    @staticmethod
    async def delete_image(public_id: str) -> bool:
        """Delete an image from Cloudinary."""
        try:
            result = cloudinary.uploader.destroy(public_id, invalidate=True)
            return result.get("result") == "ok"
        except Exception as e:
            # Don't fail the request if deletion fails
            print(f"Image deletion failed: {str(e)}")
            return False
