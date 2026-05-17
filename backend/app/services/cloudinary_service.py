"""Cloudinary Service - File/Image Storage"""
import cloudinary
import cloudinary.uploader
from typing import Dict, Optional
from app.core.config import settings

class CloudinaryService:
    def __init__(self):
        self.enabled = False
        
        # Check if credentials are set
        if (settings.CLOUDINARY_CLOUD_NAME and 
            settings.CLOUDINARY_API_KEY and 
            settings.CLOUDINARY_API_SECRET):
            
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                api_key=settings.CLOUDINARY_API_KEY,
                api_secret=settings.CLOUDINARY_API_SECRET
            )
            self.enabled = True
            print(f"✅ Cloudinary configured: {settings.CLOUDINARY_CLOUD_NAME}")
        else:
            print("⚠️ Cloudinary not configured - set CLOUDINARY_* in .env")
    
    async def upload_file(self, file_content: bytes, filename: str, folder: str = "evidence") -> Dict:
        """Upload file to Cloudinary"""
        if not self.enabled:
            return {"url": "", "public_id": "", "error": "Cloudinary not configured"}
        
        try:
            upload_result = cloudinary.uploader.upload(
                file_content,
                public_id=f"{folder}/{filename.replace(' ', '_')}",
                resource_type="auto",
                folder=folder
            )
            
            return {
                "url": upload_result.get("secure_url", ""),
                "public_id": upload_result.get("public_id", ""),
                "format": upload_result.get("format", ""),
                "size": upload_result.get("bytes", 0),
                "resource_type": upload_result.get("resource_type", "auto")
            }
        except Exception as e:
            print(f"❌ Cloudinary upload error: {e}")
            return {"url": "", "public_id": "", "error": str(e)}
    
    async def delete_file(self, public_id: str) -> bool:
        """Delete file from Cloudinary"""
        if not self.enabled or not public_id:
            return False
        
        try:
            result = cloudinary.uploader.destroy(public_id)
            return result.get("result") == "ok"
        except Exception as e:
            print(f"❌ Cloudinary delete error: {e}")
            return False
    
    async def get_url(self, public_id: str, options: Dict = None) -> str:
        """Get Cloudinary URL with transformations"""
        if not self.enabled or not public_id:
            return ""
        
        if options:
            return cloudinary.CloudinaryImage(public_id).build_url(**options)
        return cloudinary.CloudinaryImage(public_id).build_url()

# Create singleton
cloudinary_service = CloudinaryService()